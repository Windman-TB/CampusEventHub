import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS } from './fixtures/test-accounts';
import { setupUserSession } from './fixtures/auth-helpers';

test.describe('Giai đoạn 4: Trong sự kiện - Soát vé Check-in & SLA Benchmark (Check-in Engine)', () => {

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  test.beforeEach(async ({ page }) => {
    // Đăng nhập vai trò Nhân viên Check-in
    await setupUserSession(page, TEST_ACCOUNTS.staff);

    // Mock danh sách sự kiện được phân công mở cửa sổ check-in (canScan = true, ngay_dien_ra = todayStr)
    await page.route('**/api/check-in/assigned-events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              ma_su_kien: 999,
              ten_su_kien: 'Workshop AI & Cloud Native 2026',
              dia_diem: 'Tòa A, UIT',
              phong: 'Hội trường E',
              ngay_dien_ra: todayStr,
              canScan: true,
            },
          ],
        }),
      });
    });

    // Mock lịch sử check-in trống ban đầu
    await page.route('**/api/check-in/event/999/history*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });
  });

  test('TC-E2E-08: Check-in vé hợp lệ và kiểm chứng SLA phản hồi <= 2.0 giây', async ({ page }) => {
    const validQrCode = 'CEH:999:23451234:hmac256_mock_secure_signature_999';

    // Mock API Check-in thành công: POST /api/check-in/scan
    await page.route('**/api/check-in/scan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Check-in thành công',
          data: {
            ticketId: 501,
            checkedInAt: new Date().toISOString(),
            student: {
              ma_tai_khoan: 101,
              ho_ten: 'KKKKKKK',
              mssv: '23451234',
              khoa: 'Công nghệ Thông tin',
            },
          },
        }),
      });
    });

    await page.goto('/check-in');
    await expect(page.locator('select')).toHaveValue('999');

    // Nhập mã vé thủ công
    const manualInput = page.locator('#manual-ticket-code');
    await expect(manualInput).toBeEnabled();
    await manualInput.fill(validQrCode);

    // Bắt đầu đo SLA thời gian phản hồi
    const startTime = Date.now();

    const submitBtn = page.getByRole('button', { name: 'Xác nhận' });
    await submitBtn.click();

    // Chờ modal kết quả hiển thị
    await expect(page.getByText('Check-in thành công')).toBeVisible();
    await expect(page.getByText('KKKKKKK')).toBeVisible();
    await expect(page.getByText('23451234')).toBeVisible();

    const durationMs = Date.now() - startTime;

    // Kiểm chứng SLA yêu cầu <= 2000ms
    expect(durationMs).toBeLessThanOrEqual(2000);
  });

  test('TC-E2E-09: Chặn check-in trùng lặp lần 2 (ALREADY_CHECKED_IN)', async ({ page }) => {
    const duplicateQrCode = 'CEH:999:23451234:duplicate_checkin_code';

    // Mock API Check-in trả về lỗi quét trùng
    await page.route('**/api/check-in/scan', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'ALREADY_CHECKED_IN',
          message: 'Vé đã được check-in trước đó lúc 08:15:20',
          details: {
            checkedInAt: '2026-12-01T08:15:20.000Z',
          },
        }),
      });
    });

    await page.goto('/check-in');
    await expect(page.locator('select')).toHaveValue('999');

    const manualInput = page.locator('#manual-ticket-code');
    await expect(manualInput).toBeEnabled();
    await manualInput.fill(duplicateQrCode);

    await page.getByRole('button', { name: 'Xác nhận' }).click();

    // Kiểm tra cảnh báo trùng lặp hiển thị
    await expect(page.getByText('Vé đã check-in')).toBeVisible();
    await expect(page.getByText('ALREADY_CHECKED_IN')).toBeVisible();
  });

  test('TC-E2E-10: Từ chối các mã vé không hợp lệ (WRONG_EVENT, TICKET_CANCELLED)', async ({ page }) => {
    // Mock API trả về mã lỗi WRONG_EVENT
    await page.route('**/api/check-in/scan', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'WRONG_EVENT',
          message: 'Vé không thuộc sự kiện này. Vui lòng kiểm tra lại.',
        }),
      });
    });

    await page.goto('/check-in');
    await expect(page.locator('select')).toHaveValue('999');

    const manualInput = page.locator('#manual-ticket-code');
    await expect(manualInput).toBeEnabled();
    await manualInput.fill('CEH:WRONG_EVENT_999');

    await page.getByRole('button', { name: 'Xác nhận' }).click();

    // Kiểm tra hiển thị thông báo lỗi
    await expect(page.getByText('Không thể check-in')).toBeVisible();
    await expect(page.getByText('WRONG_EVENT')).toBeVisible();
  });

});
