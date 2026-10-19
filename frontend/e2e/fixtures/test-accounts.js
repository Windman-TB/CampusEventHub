/**
 * Danh sách tài khoản thử nghiệm chuẩn do người dùng cung cấp
 * và dùng cho toàn bộ hệ thống test E2E Playwright.
 */
export const TEST_ACCOUNTS = {
  organizer: {
    email: 'btc.cntt@uit.edu.vn',
    password: 'ToChuc@123',
    mssv: 'BTC_CNTT01',
    name: 'Ban To Chuc Khoa Cong Nghe Thong Tin',
    role: 'ToChuc',
  },
  staff: {
    identifier: '24521825',
    password: 'TriMup123',
    email: '24521825@gm.uit.edu.vn',
    name: 'Trí B',
    role: 'NhanVienCheckIn',
  },
  student1: {
    identifier: 'hehehe@gmail.com',
    password: '12345678',
    mssv: '23451234',
    name: 'KKKKKKK',
    role: 'SinhVien',
  },
  student2: {
    identifier: 'kkkkkkkk@gmail.com',
    password: '12345678',
    mssv: '23456789',
    name: 'fail',
    role: 'SinhVien',
  },
  student3: {
    identifier: 'thanhtri270106@gmail.com',
    password: '12345678',
    mssv: '24521826',
    role: 'SinhVien',
  },
};
