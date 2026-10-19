import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS } from './fixtures/test-accounts';
import { setupUserSession } from './fixtures/auth-helpers';

test.describe('Giai đoạn 3: Trước sự kiện - Hủy vé & Nhắc nhở (Pre-Event Lifecycle)', () => {

  test('TC-E2E-07: Sinh viên hủy vé thành công và hoàn trả slot trống cho sự kiện', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.student1);

    let ticketCancelled = false;

    // Mock API danh sách vé cá nhân: GET /api/tickets/my-tickets
    await page.route('**/api/tickets/my-tickets', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            upcoming: ticketCancelled
              ? []
              : [
                  {
                    ma_dang_ky: 501,
                    trang_thai_ve: 'DaDangKy',
                    canShowQr: true,
                    canCancel: true,
                    ma_qr_code: 'CEH:999:23451234:hmac256_mock_secure_signature_999',
                    su_kien: {
                      ma_su_kien: 999,
                      ten_su_kien: 'Workshop AI & Cloud Native 2026',
                      ngay_dien_ra: '2026-12-01',
                      dia_diem: 'Tòa A, UIT',
                      phong: 'Hội trường E',
                    },
                  },
                ],
            history: ticketCancelled
              ? [
                  {
                    ma_dang_ky: 501,
                    trang_thai_ve: 'DaHuy',
                    canShowQr: false,
                    canCancel: false,
                    su_kien: {
                      ma_su_kien: 999,
                      ten_su_kien: 'Workshop AI & Cloud Native 2026',
                      ngay_dien_ra: '2026-12-01',
                      dia_diem: 'Tòa A, UIT',
                    },
                  },
                ]
              : [],
          },
        }),
      });
    });

    // Mock API Hủy vé: POST /api/tickets/501/cancel
    await page.route('**/api/tickets/501/cancel', async (route) => {
      ticketCancelled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Đã hủy vé thành công và hoàn lại 1 slot cho sự kiện.',
        }),
      });
    });

    // 1. Sinh viên vào trang "Vé của tôi"
    await page.goto('/tickets');
    await expect(page.getByText('Workshop AI & Cloud Native 2026')).toBeVisible();
    await expect(page.getByText('Còn hiệu lực')).toBeVisible();

    // 2. Bấm nút "Hủy vé"
    const cancelBtn = page.getByRole('button', { name: 'Hủy vé' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // 3. Modal xác nhận "Hủy vé?" xuất hiện
    await expect(page.getByRole('heading', { name: 'Hủy vé?' })).toBeVisible();

    // 4. Bấm "Xác nhận" trên modal
    const confirmBtn = page.getByRole('button', { name: 'Xác nhận' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Kiểm tra vé biến mất khỏi tab Sắp diễn ra và chuyển sang tab Lịch sử với trạng thái "Đã hủy"
    const historyTab = page.getByRole('button', { name: 'Lịch sử' });
    await historyTab.click();
    await expect(page.getByText('Đã hủy')).toBeVisible();
  });

  test('TC-E2E-11: Kiểm tra cơ chế thông báo & Email nhắc nhở trước 24 giờ', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.student1);

    // Mock API thông báo nhắc nhở 24h: GET /api/notifications
    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              title: 'Nhắc nhở sự kiện sắp diễn ra',
              message: 'Sự kiện Workshop AI & Cloud Native 2026 sẽ bắt đầu sau 24 giờ. Hãy chuẩn bị mã QR để check-in.',
              time: '10 phút trước',
              isNew: true,
              type: 'calendar',
            },
          ],
        }),
      });
    });

    // Mock API danh mục: GET /api/categories
    await page.route('**/api/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    // Mock API sự kiện trang chủ: GET /api/events
    await page.route('**/api/events?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { events: [], total: 0 },
        }),
      });
    });

    await page.goto('/home');

    // Mở popup thông báo bằng cách click vào icon Bell
    const bellIcon = page.locator('svg.lucide-bell').first();
    await bellIcon.click();

    // Kiểm tra nội dung thông báo nhắc nhở trước sự kiện xuất hiện
    await expect(page.getByText('Nhắc nhở sự kiện sắp diễn ra')).toBeVisible();
    await expect(page.getByText('sau 24 giờ')).toBeVisible();
  });

});
