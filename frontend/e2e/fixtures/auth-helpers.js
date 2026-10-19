/**
 * Helper hỗ trợ thiết lập phiên đăng nhập nhanh cho Playwright E2E
 */
export async function setupUserSession(page, account) {
  const token = `mock_token_for_${account.role.toLowerCase()}`;
  const userPayload = {
    ma_tai_khoan: account.id || 1,
    ho_ten: account.name || 'Người dùng Kiểm thử',
    email: account.email || `${account.identifier}@uit.edu.vn`,
    mssv: account.mssv || (account.identifier?.startsWith('2') ? account.identifier : 'BTC_CNTT01'),
    loai_tai_khoan: account.role,
    khoa: 'Công nghệ Thông tin',
  };

  await page.addInitScript(
    ({ token, user, role }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('app_role', role);
    },
    { token, user: userPayload, role: account.role }
  );
}
