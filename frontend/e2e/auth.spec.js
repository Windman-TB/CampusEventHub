import { test, expect } from '@playwright/test';

test.describe('CampusEventHub - Luồng Xác thực (Auth E2E Flow)', () => {

  test.beforeEach(async ({ page }) => {
    // Truy cập trang đăng nhập trước mỗi test case
    await page.goto('/login');
  });

  test('TC-AUTH-01: Hiển thị đầy đủ giao diện Đăng nhập và các trường nhập liệu', async ({ page }) => {
    // 1. Kiểm tra tiêu đề chính
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
    await expect(page.getByText('Đăng nhập để tiếp tục')).toBeVisible();

    // 2. Kiểm tra tab Đăng nhập và Đăng ký
    const loginTab = page.locator('button[type="button"]', { hasText: 'Đăng nhập' });
    const registerTab = page.locator('button[type="button"]', { hasText: 'Đăng ký' });
    await expect(loginTab).toBeVisible();
    await expect(registerTab).toBeVisible();

    // 3. Kiểm tra các ô input
    const identifierInput = page.getByPlaceholder('email@uit.edu.vn hoặc 2252xxxx');
    const passwordInput = page.getByPlaceholder('••••••••');
    await expect(identifierInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // 4. Kiểm tra nút Submit
    const submitBtn = page.locator('form button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText('Đăng nhập');
  });

  test('TC-AUTH-02: Chuyển đổi mượt mà giữa Tab Đăng nhập và Đăng ký', async ({ page }) => {
    // Chuyển sang Tab Đăng ký
    await page.locator('button[type="button"]', { hasText: 'Đăng ký' }).click();
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản mới' })).toBeVisible();
    await expect(page.getByPlaceholder('Nguyễn Văn A')).toBeVisible();

    // Chuyển ngược lại Tab Đăng nhập
    await page.locator('button[type="button"]', { hasText: 'Đăng nhập' }).click();
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
  });

  test('TC-AUTH-03: Hiển thị thông báo lỗi khi thông tin đăng nhập không hợp lệ', async ({ page }) => {
    // Mock API /api/auth/login trả về lỗi 401
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Tài khoản hoặc mật khẩu không chính xác.',
        }),
      });
    });

    // Điền thông tin sai
    await page.getByPlaceholder('email@uit.edu.vn hoặc 2252xxxx').fill('99999999');
    await page.getByPlaceholder('••••••••').fill('SaiMatKhau123');

    // Bấm Đăng nhập
    await page.locator('form button[type="submit"]').click();

    // Kiểm tra thông báo lỗi hiển thị
    const errorAlert = page.locator('div[style*="background: rgb(254, 242, 242)"], div[style*="#fef2f2"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Tài khoản hoặc mật khẩu không chính xác.');
  });

  test('TC-AUTH-04: Đăng nhập thành công với vai trò Sinh viên và điều hướng vào /home', async ({ page }) => {
    // Mock API /api/auth/login trả về thông tin đăng nhập thành công cho SinhVien
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock_jwt_token_for_playwright_test',
            user: {
              id: 101,
              ho_ten: 'Nguyễn Văn Playwright',
              email: 'playwright@uit.edu.vn',
              mssv: '22529999',
              loai_tai_khoan: 'SinhVien',
            },
          },
        }),
      });
    });

    // Điền thông tin đăng nhập
    await page.getByPlaceholder('email@uit.edu.vn hoặc 2252xxxx').fill('22529999');
    await page.getByPlaceholder('••••••••').fill('MatKhauChuan123');

    // Bấm Đăng nhập
    await page.locator('form button[type="submit"]').click();

    // Kiểm tra điều hướng URL sang /home
    await expect(page).toHaveURL(/\/home/);

    // Kiểm tra localStorage đã lưu accessToken và user
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('accessToken'));
    const userInStorage = await page.evaluate(() => localStorage.getItem('user'));
    
    expect(tokenInStorage).toBe('mock_jwt_token_for_playwright_test');
    expect(userInStorage).toContain('Nguyễn Văn Playwright');
  });

  test('TC-AUTH-05: Đăng nhập thành công với vai trò Ban Tổ chức và điều hướng vào /dashboard', async ({ page }) => {
    // Mock API /api/auth/login trả về vai trò ToChuc
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock_jwt_organizer_token',
            user: {
              id: 202,
              ho_ten: 'Ban Tổ Chức Đoàn Hội',
              email: 'organizer@uit.edu.vn',
              loai_tai_khoan: 'ToChuc',
            },
          },
        }),
      });
    });

    // Điền thông tin đăng nhập
    await page.getByPlaceholder('email@uit.edu.vn hoặc 2252xxxx').fill('organizer@uit.edu.vn');
    await page.getByPlaceholder('••••••••').fill('OrganizerPass123');

    // Bấm Đăng nhập
    await page.locator('form button[type="submit"]').click();

    // Kiểm tra điều hướng URL sang /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

});
