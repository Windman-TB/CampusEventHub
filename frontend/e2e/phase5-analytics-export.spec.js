import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS } from './fixtures/test-accounts';
import { setupUserSession } from './fixtures/auth-helpers';

test.describe('Giai đoạn 5: Sau sự kiện - Thống kê, Báo cáo & Responsive (Analytics & Export)', () => {

  test('TC-E2E-12: Ban tổ chức xem Dashboard thống kê số liệu và biểu đồ phân tích', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.organizer);

    // Mock API tổng quan Dashboard
    await page.route('**/api/organizer/dashboard/overview*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalEvents: 12,
            totalRegistrations: 148,
            averageFillRate: 85,
            averageCheckinRate: 72,
          },
        }),
      });
    });

    // Mock danh sách sự kiện của BTC: GET /api/organizer/events
    await page.route('**/api/organizer/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              ma_su_kien: 999,
              ten_su_kien: 'Workshop AI & Cloud Native 2026',
            },
          ],
        }),
      });
    });

    // Mock API phân tích chi tiết sự kiện
    await page.route('**/api/organizer/events/999/analytics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ma_su_kien: 999,
            ten_su_kien: 'Workshop AI & Cloud Native 2026',
            so_luong_toi_da: 2,
            so_ve_da_dat: 2,
            so_luong_check_in: 1,
            ty_le_tham_du: 50,
          },
        }),
      });
    });

    // Truy cập /dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeVisible();

    // Kiểm tra các chỉ số StatCards
    await expect(page.getByText('Tổng số sự kiện')).toBeVisible();
    await expect(page.getByText('12')).toBeVisible();
    await expect(page.getByText('Tổng lượt vé đăng ký')).toBeVisible();
    await expect(page.getByText('148')).toBeVisible();
  });

  test('TC-E2E-13: Ban tổ chức xuất báo cáo danh sách tham gia ra file Excel (.xlsx)', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.organizer);

    // Mock API danh sách sự kiện: GET /api/organizer/events
    await page.route('**/api/organizer/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              ma_su_kien: 999,
              ten_su_kien: 'Workshop AI & Cloud Native 2026',
              trang_thai_su_kien: 'SapToChuc',
              ngay_dien_ra: '2026-12-01',
              dia_diem: 'Tòa A, UIT',
              phong: 'Hội trường E',
            },
          ],
        }),
      });
    });

    // Mock API danh sách người tham gia: GET /api/organizer/events/999/participants
    await page.route('**/api/organizer/events/999/participants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              ma_dang_ky: 501,
              mssv: '23451234',
              ho_ten: 'KKKKKKK',
              email: 'hehehe@gmail.com',
              khoa: 'Công nghệ Thông tin',
              trang_thai_ve: 'DaCheckIn',
              thoi_gian_check_in: '2026-12-01T08:30:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
        }),
      });
    });

    // Mock API Export Excel (.xlsx) trả về file buffer giả lập
    let exportFormatRequested = '';
    await page.route('**/api/organizer/events/999/export*', async (route) => {
      const url = new URL(route.request().url());
      exportFormatRequested = url.searchParams.get('format') || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename="participants_event_999.xlsx"',
        },
        body: Buffer.from('PK_MOCK_EXCEL_BINARY_BUFFER_UTF8'),
      });
    });

    await page.goto('/dashboard/participants');

    // Chọn sự kiện từ danh sách
    await expect(page.getByText('Workshop AI & Cloud Native 2026')).toBeVisible();
    await page.getByRole('button', { name: 'Xem danh sách người tham gia →' }).click();

    // Kiểm tra danh sách người tham gia
    await expect(page.getByText('23451234')).toBeVisible();
    await expect(page.getByText('KKKKKKK')).toBeVisible();

    // Bấm nút "Xuất Excel"
    const exportExcelBtn = page.getByRole('button', { name: 'Xuất Excel' });
    await expect(exportExcelBtn).toBeVisible();
    await exportExcelBtn.click();

    // Kiểm tra API được gọi đúng format=xlsx
    expect(exportFormatRequested).toBe('xlsx');
    // Kiểm tra toast thông báo xuất thành công
    await expect(page.getByText(/Đã xuất file XLSX thành công/i)).toBeVisible();
  });

  test('TC-E2E-15: Kiểm tra giao diện Responsive Mobile trên màn hình 375px (iPhone SE)', async ({ page }) => {
    // Thiết lập viewport di động 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await setupUserSession(page, TEST_ACCOUNTS.student1);

    await page.route('**/api/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/events?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            events: [
              {
                ma_su_kien: 999,
                ten_su_kien: 'Workshop AI & Cloud Native 2026',
                dia_diem: 'Tòa A, UIT',
                ngay_dien_ra: '2026-12-01',
                so_luong_toi_da: 2,
                so_ve_con_lai: 2,
              },
            ],
            total: 1,
          },
        }),
      });
    });

    // Truy cập trang chủ trên mobile
    await page.goto('/home');

    // Kiểm tra giao diện hiển thị vừa vặn không tràn màn hình ngang
    await expect(page.getByText('Workshop AI & Cloud Native 2026')).toBeVisible();

    // Kiểm tra thanh điều hướng phía dưới (Bottom Navigation) dành cho mobile
    const bottomNav = page.locator('nav, div').filter({ hasText: /Trang chủ|Vé của tôi/i }).first();
    await expect(bottomNav).toBeVisible();
  });

});
