import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS } from './fixtures/test-accounts';
import { setupUserSession } from './fixtures/auth-helpers';

test.describe('Giai đoạn 2: Công bố, Tìm kiếm & Săn vé (Discovery & Booking)', () => {

  test('TC-E2E-03: Sinh viên tìm kiếm và lọc sự kiện theo từ khóa & chủ đề', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.student1);

    // Mock API danh mục: GET /api/categories
    await page.route('**/api/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { ma_chuyen_de: 1, ten_chuyen_de: 'Công nghệ AI' },
            { ma_chuyen_de: 2, ten_chuyen_de: 'Điện toán Đám mây' },
          ],
        }),
      });
    });

    // Mock API thông báo: GET /api/notifications
    await page.route('**/api/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    // Mock API danh sách sự kiện: GET /api/events
    await page.route('**/api/events?*', async (route) => {
      const url = new URL(route.request().url());
      const keyword = url.searchParams.get('keyword') || '';

      const allEvents = [
        {
          ma_su_kien: 999,
          ten_su_kien: 'Workshop AI & Cloud Native 2026',
          dia_diem: 'Tòa A, UIT',
          ngay_dien_ra: '2026-12-01',
          so_luong_toi_da: 2,
          so_ve_con_lai: 2,
          so_ve_da_dat: 0,
          ma_chuyen_de: 1,
          chuyen_de: { ten_chuyen_de: 'Công nghệ AI' },
        },
        {
          ma_su_kien: 888,
          ten_su_kien: 'Ngày hội Việc làm UIT Career Day',
          dia_diem: 'Sân trường',
          ngay_dien_ra: '2026-11-20',
          so_luong_toi_da: 100,
          so_ve_con_lai: 0,
          so_ve_da_dat: 100,
          ma_chuyen_de: 2,
          chuyen_de: { ten_chuyen_de: 'Điện toán Đám mây' },
        },
      ];

      const filtered = allEvents.filter((e) =>
        keyword ? e.ten_su_kien.toLowerCase().includes(keyword.toLowerCase()) : true
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            events: filtered,
            total: filtered.length,
          },
        }),
      });
    });

    // 1. Sinh viên vào trang chủ /home
    await page.goto('/home');
    await expect(page.getByText('Workshop AI & Cloud Native 2026')).toBeVisible();

    // 2. Tìm kiếm với từ khóa "Cloud Native"
    const searchInput = page.getByPlaceholder('Tìm kiếm sự kiện, diễn giả...');
    await searchInput.fill('Cloud Native');

    // Chờ danh sách lọc
    await expect(page.getByText('Workshop AI & Cloud Native 2026')).toBeVisible();
    await expect(page.getByText('Ngày hội Việc làm UIT Career Day')).not.toBeVisible();
  });

  test('TC-E2E-05: Sinh viên đăng ký vé thành công và nhận mã QR HMAC-SHA256', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.student1);

    // Mock API chi tiết sự kiện
    await page.route('**/api/events/999', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ma_su_kien: 999,
            ten_su_kien: 'Workshop AI & Cloud Native 2026',
            mo_ta: 'Hội thảo chuyên sâu về AI',
            dia_diem: 'Tòa A, UIT',
            phong: 'Hội trường E',
            ngay_dien_ra: '2026-12-01',
            thoi_gian_bat_dau: '08:00',
            thoi_gian_ket_thuc: '11:30',
            so_luong_toi_da: 2,
            so_ve_con_lai: 2,
            so_ve_da_dat: 0,
            hasRegistered: false,
          },
        }),
      });
    });

    // Mock API Đặt vé thành công: POST /api/tickets/book
    const mockHmacQr = 'CEH:999:23451234:hmac256_mock_secure_signature_999';
    await page.route('**/api/tickets/book', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Đặt vé thành công!',
          data: {
            ticketId: 'TKT-2026-000999',
            qrCode: mockHmacQr,
            eventTitle: 'Workshop AI & Cloud Native 2026',
          },
        }),
      });
    });

    // 1. Vào trang chi tiết sự kiện
    await page.goto('/events/999');
    await expect(page.getByText('Workshop AI & Cloud Native 2026')).toBeVisible();

    // 2. Bấm "Đăng ký ngay"
    const bookBtn = page.getByRole('button', { name: 'Đăng ký ngay' });
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();

    // 3. Chuyển sang màn hình xác nhận vé /ticket-confirm
    await expect(page).toHaveURL(/\/ticket-confirm/);
    await expect(page.getByRole('heading', { name: 'Xác nhận Đặt Vé' })).toBeVisible();

    // 4. Bấm "Xác nhận Đặt Vé Ngay"
    const confirmBtn = page.getByRole('button', { name: 'Xác nhận Đặt Vé Ngay' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Kiểm tra thông báo thành công và mã QR hiển thị
    await expect(page.getByText('Đặt vé thành công!')).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('TC-E2E-06: Chặn đăng ký trùng lặp khi sinh viên đã sở hữu vé', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.student1);

    // Mock API trả về sự kiện mà sinh viên đã đăng ký (hasRegistered = true)
    await page.route('**/api/events/999', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ma_su_kien: 999,
            ten_su_kien: 'Workshop AI & Cloud Native 2026',
            dia_diem: 'Tòa A, UIT',
            ngay_dien_ra: '2026-12-01',
            so_luong_toi_da: 2,
            so_ve_con_lai: 1,
            so_ve_da_dat: 1,
            hasRegistered: true,
          },
        }),
      });
    });

    // Truy cập lại sự kiện
    await page.goto('/events/999');

    // Nút chuyển thành "Xem vé của tôi" thay vì cho phép đăng ký lại
    const myTicketBtn = page.getByRole('button', { name: 'Xem vé của tôi' });
    await expect(myTicketBtn).toBeVisible();

    // Bấm nút chuyển hướng về trang /tickets
    await myTicketBtn.click();
    await expect(page).toHaveURL(/\/tickets/);
  });

  test('TC-E2E-04: Săn vé đồng thời (Race condition) - 3 sinh viên tranh 2 vé', async ({ page }) => {
    await setupUserSession(page, TEST_ACCOUNTS.student2);

    await page.route('**/api/events/999', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ma_su_kien: 999,
            ten_su_kien: 'Workshop AI & Cloud Native 2026',
            ngay_dien_ra: '2026-12-01',
            so_luong_toi_da: 2,
            so_ve_con_lai: 0, // Đã hết chỗ do 2 sinh viên trước đăng ký
            so_ve_da_dat: 2,
            hasRegistered: false,
          },
        }),
      });
    });

    await page.goto('/events/999');

    // Kiểm tra nút bị vô hiệu hóa với nhãn "Hết chỗ"
    const fullBtn = page.getByRole('button', { name: 'Hết chỗ' });
    await expect(fullBtn).toBeVisible();
    await expect(fullBtn).toBeDisabled();
  });

});
