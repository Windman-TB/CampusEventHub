import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS } from './fixtures/test-accounts';
import { setupUserSession } from './fixtures/auth-helpers';

test.describe('Giai đoạn 1: Chuẩn bị & Phân quyền (Organizer Event Setup)', () => {

  test('TC-E2E-01: Organizer tạo sự kiện mới với Capacity = 2 và ràng buộc hợp lệ', async ({ page }) => {
    // 1. Giả lập đăng nhập vai trò Ban Tổ Chức (ToChuc)
    await setupUserSession(page, TEST_ACCOUNTS.organizer);

    // Mock API danh mục chuyên đề: GET /api/categories
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

    // Mock API tạo sự kiện: POST /api/events
    let createdPayload = null;
    await page.route('**/api/events', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = JSON.parse(route.request().postData());
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Đã xuất bản sự kiện thành công!',
            data: {
              ma_su_kien: 999,
              ten_su_kien: createdPayload.ten_su_kien,
              so_luong_toi_da: createdPayload.so_luong_toi_da,
              so_luong_con_lai: createdPayload.so_luong_toi_da,
              trang_thai_su_kien: 'SapToChuc',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock API danh sách sự kiện sau khi điều hướng về /dashboard/events: GET /api/organizer/events
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
              so_luong_toi_da: 2,
              so_luong_con_lai: 2,
              trang_thai_su_kien: 'SapToChuc',
              ngay_dien_ra: '2026-12-01',
            },
          ],
        }),
      });
    });

    // 2. Truy cập màn hình tạo sự kiện mới
    await page.goto('/dashboard/events/new');
    await expect(page.getByRole('heading', { name: 'Tạo sự kiện mới' })).toBeVisible();

    // 3. Điền thông tin form sự kiện
    await page.getByPlaceholder('Vd: Hội thảo AI 2026...').fill('Workshop AI & Cloud Native 2026');
    await page.getByPlaceholder('Vd: TS. Nguyễn Văn A').fill('TS. Trần Công Nghệ');
    await page.getByPlaceholder('Nội dung, mục đích...').fill('Chia sẻ xu hướng công nghệ mới');
    await page.getByPlaceholder('Các quyền lợi khi tham gia sự kiện').fill('Cộng 5 điểm rèn luyện');

    // Điền thời gian (ngày trong tương lai)
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2026-12-01');

    const startTimeInput = page.locator('input[type="time"]').first();
    const endTimeInput = page.locator('input[type="time"]').nth(1);
    await startTimeInput.fill('08:00');
    await endTimeInput.fill('11:30');

    // Địa điểm & Phòng
    await page.getByPlaceholder('Vd: Tòa A, ĐH CNTT').fill('Tòa A, UIT');
    await page.getByPlaceholder('Vd: Hội trường E').fill('Hội trường E');

    // Sức chứa capacity = 2
    const capacityInput = page.locator('input[type="number"]');
    await capacityInput.fill('2');

    // 4. Bắt sự kiện dialog alert thành công
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 5. Submit form "Xuất bản sự kiện"
    const publishBtn = page.getByRole('button', { name: 'Xuất bản sự kiện' });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // 6. Kiểm tra điều hướng về /dashboard/events
    await expect(page).toHaveURL(/\/dashboard\/events/);
    expect(createdPayload.so_luong_toi_da).toBe(2);
    expect(createdPayload.trang_thai_su_kien).toBe('SapToChuc');
  });

  test('TC-E2E-02: Phân quyền Staff check-in và Staff thấy sự kiện trong danh sách phụ trách', async ({ page }) => {
    // 1. Đăng nhập Ban Tổ Chức
    await setupUserSession(page, TEST_ACCOUNTS.organizer);

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
              trang_thai_su_kien: 'SapToChuc',
            },
          ],
        }),
      });
    });

    // Mock API tìm kiếm sinh viên: GET /api/organizer/students/search
    await page.route('**/api/organizer/students/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              ma_tai_khoan: 26,
              mssv: '24521825',
              ho_ten: 'Trí B',
              email: '24521825@gm.uit.edu.vn',
              khoa: 'Công nghệ Thông tin',
              trang_thai_tai_khoan: 'HoatDong',
            },
          ],
        }),
      });
    });

    // Mock API lấy danh sách và gán quyền nhân viên của sự kiện 999
    let staffAssigned = false;
    await page.route('**/api/organizer/events/999/staff', async (route) => {
      if (route.request().method() === 'POST') {
        staffAssigned = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Đã phân công nhân viên soát vé thành công!',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: staffAssigned
              ? [
                  {
                    ma_nhan_vien: 1,
                    ma_su_kien: 999,
                    ma_tai_khoan: 26,
                    mssv: '24521825',
                    ho_ten: 'Trí B',
                    quyen_diem_danh: true,
                    vai_tro: 'NhanVienCheckIn',
                  },
                ]
              : [],
          }),
        });
      }
    });

    // 2. BTC vào màn hình Quản lý nhân viên
    await page.goto('/dashboard/staff');
    await expect(page.getByRole('heading', { name: 'Quản lý nhân viên soát vé' })).toBeVisible();

    // Chọn sự kiện 999
    const eventSelect = page.locator('select').first();
    await eventSelect.selectOption('999');

    // Mở modal Thêm nhân viên
    await page.getByRole('button', { name: 'Phân công nhân viên mới' }).click();
    await expect(page.getByRole('heading', { name: 'Phân công nhân viên soát vé' })).toBeVisible();

    // Nhập MSSV 24521825 để tìm kiếm
    const searchInput = page.getByPlaceholder('Nhập MSSV (vd: 22521001) hoặc họ tên...');
    await searchInput.fill('24521825');

    // Chờ kết quả tìm kiếm và click chọn sinh viên
    await expect(page.getByText('Trí B')).toBeVisible();
    await page.getByText('Trí B').click();

    // Bấm nút "Xác nhận cấp quyền"
    await page.getByRole('button', { name: 'Xác nhận cấp quyền' }).click();

    // Kiểm tra danh sách hiển thị nhân viên vừa gán
    await expect(page.getByText('24521825', { exact: true })).toBeVisible();

    // 3. Chuyển ngữ cảnh sang Nhân viên Check-in (Staff Login)
    await setupUserSession(page, TEST_ACCOUNTS.staff);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Mock API sự kiện phụ trách của nhân viên: GET /api/check-in/assigned-events
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
              so_luong_con_lai: 2,
            },
          ],
        }),
      });
    });

    // Mock lịch sử check-in trống
    await page.route('**/api/check-in/event/999/history*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [] },
        }),
      });
    });

    // Staff truy cập /check-in và thấy sự kiện được chọn trong dropdown
    await page.goto('/check-in');
    await expect(page.locator('select')).toHaveValue('999');
  });

});
