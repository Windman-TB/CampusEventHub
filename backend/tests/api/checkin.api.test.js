/**
 * API Integration Tests - Check-in Scan Endpoint (TC-E2E-08 to TC-E2E-10)
 *
 * Strategy: Mock checkin.service để test HTTP layer (routing, middleware, controller)
 *           độc lập với DB. Phủ toàn bộ error codes từ scanTicket + RBAC guard.
 *
 * Coverage map:
 *   TC-E2E-08: Check-in thành công (Happy Path) - SLA payload shape
 *   TC-E2E-09: Duplicate Check-in (ALREADY_CHECKED_IN → 409)
 *   TC-E2E-10: Vé sai sự kiện (WRONG_EVENT → 409)
 *   TC-E2E-10: Vé đã hủy (TICKET_CANCELLED → 409)
 *   TC-E2E-10: Mã vé không tồn tại (INVALID_TICKET → 404)
 *   TC-E2E-10: Ngoài khung giờ (CHECK_IN_CLOSED → 409)
 *   AC-5.1:    Validation mã vé rỗng (VALIDATION_ERROR → 400)
 *   AC-5.1:    Sinh viên bị chặn (RBAC: SinhVien → 403)
 *   AC-5.1:    Không có token (→ 401)
 */

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));
jest.mock('../../src/utils/jwt.js', () => ({ verifyAccessToken: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app.js');
const supabase = require('../../src/config/supabase.js');
const { verifyAccessToken } = require('../../src/utils/jwt.js');

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

const STAFF_ID = 7;
const ORGANIZER_ID = 5;
const EVENT_ID = 10;
const VALID_QR = 'abc123def456valid-qr-hash';

const STAFF_DB_USER = {
  ma_tai_khoan: STAFF_ID,
  loai_tai_khoan: 'NhanVienCheckIn',
  trang_thai_tai_khoan: 'HoatDong',
  da_xoa: false,
};

const ORGANIZER_DB_USER = {
  ma_tai_khoan: ORGANIZER_ID,
  loai_tai_khoan: 'ToChuc',
  trang_thai_tai_khoan: 'HoatDong',
  da_xoa: false,
};

const SINHVIEN_DB_USER = {
  ma_tai_khoan: 20,
  loai_tai_khoan: 'SinhVien',
  trang_thai_tai_khoan: 'HoatDong',
  da_xoa: false,
};

const SUCCESS_PAYLOAD = {
  code: 'CHECK_IN_SUCCESS',
  ma_dang_ky: 33,
  ma_su_kien: EVENT_ID,
  student: { ma_tai_khoan: 8, mssv: '22521001', ho_ten: 'Nguyễn Văn A', khoa: 'CNTT' },
  checkedInAt: '2026-10-06T10:30:00.000Z',
};

// ─── MOCK HELPERS ──────────────────────────────────────────────────────────────

function makeChain({ data = null, error = null } = {}) {
  const resolved = { data, error };
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(resolved),
    single: jest.fn().mockResolvedValue(resolved),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ ...resolved, count: 0 }),
  };
}

/**
 * Setup auth middleware: stub verifyAccessToken + supabase auth lookup
 */
function setupAuth(dbUser) {
  verifyAccessToken.mockReturnValue({ sub: String(dbUser.ma_tai_khoan) });
  supabase.from.mockReset();
  supabase.from.mockImplementation((table) => {
    if (table === 'nhan_vien_check_in') return makeChain({ data: null });
    return makeChain({ data: dbUser });
  });
  supabase.rpc = jest.fn();
}

/**
 * Setup auth + service mock via supabase.rpc
 * Dùng khi muốn kiểm soát chính xác response của scanTicket (gọi supabase.rpc)
 */
function setupAuthWithRpc(dbUser, rpcResult) {
  verifyAccessToken.mockReturnValue({ sub: String(dbUser.ma_tai_khoan) });
  supabase.from.mockReset();
  supabase.from.mockImplementation((table) => {
    if (table === 'nhan_vien_check_in') return makeChain({ data: null });
    return makeChain({ data: dbUser });
  });
  supabase.rpc = jest.fn().mockResolvedValue(rpcResult);
}

// ─── HELPER: POST /api/check-in/scan ──────────────────────────────────────────

function scanRequest({ token = 'Bearer mock-token', body = {} } = {}) {
  return request(app)
    .post('/api/check-in/scan')
    .set('Authorization', token)
    .send(body);
}

// ─── TEST SUITES ───────────────────────────────────────────────────────────────

describe('POST /api/check-in/scan — RBAC & Auth Guards (AC-5.1)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('S1.1 - Không có token → 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/check-in/scan')
      .send({ ma_su_kien: EVENT_ID, ma_qr_code: VALID_QR });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('S1.2 - Token role SinhVien không được phân công → 403 Forbidden', async () => {
    setupAuthWithRpc(SINHVIEN_DB_USER, {
      data: { success: false, code: 'FORBIDDEN' },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: VALID_QR },
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/check-in/scan — Input Validation (AC-5.4)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('S2.1 - Body thiếu ma_qr_code → 400 VALIDATION_ERROR', async () => {
    setupAuthWithRpc(STAFF_DB_USER, null);

    // Khi scanTicket không nhận qrCode hợp lệ, service throw VALIDATION_ERROR
    supabase.rpc = jest.fn(); // ensure not called
    const serviceModule = require('../../src/services/checkin.service.js');
    // Không mock service - để nó tự validate và throw
    // Auth pass → controller call scanTicket({ qrCode: undefined }) → VALIDATION_ERROR

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID }, // thiếu ma_qr_code
    });

    // Controller map VALIDATION_ERROR → 400
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('S2.2 - Body thiếu ma_su_kien → 400 VALIDATION_ERROR', async () => {
    setupAuth(STAFF_DB_USER);
    supabase.rpc = jest.fn();

    const res = await scanRequest({
      body: { ma_qr_code: VALID_QR }, // thiếu ma_su_kien
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('S2.3 - ma_su_kien không phải số hợp lệ → 400 VALIDATION_ERROR', async () => {
    setupAuth(STAFF_DB_USER);
    supabase.rpc = jest.fn();

    const res = await scanRequest({
      body: { ma_su_kien: 'abc', ma_qr_code: VALID_QR },
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/check-in/scan — Happy Path (TC-E2E-08)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('S3.1 - NhanVienCheckIn quét mã hợp lệ → 200 + thông tin sinh viên đầy đủ', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: {
        success: true,
        code: 'CHECK_IN_SUCCESS',
        ...SUCCESS_PAYLOAD,
      },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: VALID_QR },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('thành công');
    // Kiểm tra shape dữ liệu trả về cho UI (TC-E2E-08 assertion)
    expect(res.body.data).toMatchObject({
      code: 'CHECK_IN_SUCCESS',
      ma_dang_ky: 33,
      ma_su_kien: EVENT_ID,
    });
    expect(res.body.data.student).toMatchObject({
      mssv: '22521001',
      ho_ten: 'Nguyễn Văn A',
      khoa: 'CNTT',
    });
    expect(res.body.data).toHaveProperty('checkedInAt');
    // RPC được gọi đúng tham số
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_ticket', {
      p_actor_id: STAFF_ID,
      p_ma_su_kien: EVENT_ID,
      p_ma_qr_code: VALID_QR,
    });
  });

  test('S3.2 - ToChuc (chủ sự kiện) cũng có thể soát vé → 200', async () => {
    setupAuthWithRpc(ORGANIZER_DB_USER, {
      data: {
        success: true,
        code: 'CHECK_IN_SUCCESS',
        ...SUCCESS_PAYLOAD,
        ma_su_kien: EVENT_ID,
      },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: VALID_QR },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_ticket', {
      p_actor_id: ORGANIZER_ID,
      p_ma_su_kien: EVENT_ID,
      p_ma_qr_code: VALID_QR,
    });
  });

  test('S3.3 - QR code có khoảng trắng đầu/cuối → tự động trim trước khi gọi RPC', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: { success: true, code: 'CHECK_IN_SUCCESS', ...SUCCESS_PAYLOAD },
      error: null,
    });

    const qrWithSpaces = `  ${VALID_QR}  `;

    await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: qrWithSpaces },
    });

    // Sau khi trim, RPC phải nhận chuỗi không có khoảng trắng
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_ticket', {
      p_actor_id: STAFF_ID,
      p_ma_su_kien: EVENT_ID,
      p_ma_qr_code: VALID_QR, // đã trim
    });
  });
});

describe('POST /api/check-in/scan — Duplicate Check-in (TC-E2E-09)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('S4.1 - Quét vé lần 2 (đã check-in) → 409 ALREADY_CHECKED_IN + checkedInAt cũ', async () => {
    const checkedInAt = '2026-10-06T09:00:00.000Z';
    setupAuthWithRpc(STAFF_DB_USER, {
      data: {
        success: false,
        code: 'ALREADY_CHECKED_IN',
        ma_dang_ky: 33,
        checkedInAt,
      },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: VALID_QR },
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ALREADY_CHECKED_IN');
    expect(res.body.message).toContain('check-in');
    // data.checkedInAt phải chứa thời gian check-in cũ để UI hiển thị cảnh báo
    expect(res.body.data).toHaveProperty('checkedInAt', checkedInAt);
    expect(res.body.data).toHaveProperty('ma_dang_ky', 33);
  });
});

describe('POST /api/check-in/scan — Unhappy Paths (TC-E2E-10)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('S5.1 - Vé không tồn tại → 404 INVALID_TICKET', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: { success: false, code: 'INVALID_TICKET' },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: 'qr-khong-ton-tai' },
    });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TICKET');
    expect(res.body.message).toContain('không tồn tại');
  });

  test('S5.2 - Vé thuộc sự kiện khác → 409 WRONG_EVENT', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: { success: false, code: 'WRONG_EVENT' },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: 'qr-su-kien-khac' },
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('WRONG_EVENT');
    expect(res.body.message).toContain('sự kiện');
  });

  test('S5.3 - Vé đã bị sinh viên hủy → 409 TICKET_CANCELLED', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: { success: false, code: 'TICKET_CANCELLED' },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: 'qr-da-huy' },
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TICKET_CANCELLED');
    expect(res.body.message).toContain('hủy');
  });

  test('S5.4 - Ngoài khung giờ check-in → 409 CHECK_IN_CLOSED', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: { success: false, code: 'CHECK_IN_CLOSED' },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: EVENT_ID, ma_qr_code: VALID_QR },
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CHECK_IN_CLOSED');
    expect(res.body.message).toMatch(/đóng|chưa mở/i);
  });

  test('S5.5 - Nhân viên không có quyền với sự kiện → 403 FORBIDDEN', async () => {
    setupAuthWithRpc(STAFF_DB_USER, {
      data: { success: false, code: 'FORBIDDEN' },
      error: null,
    });

    const res = await scanRequest({
      body: { ma_su_kien: 9999, ma_qr_code: VALID_QR }, // sự kiện không được phân công
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('POST /api/check-in/scan — mapTicket canCancel / canShowQr flags (AC-3.2, AC-3.4)', () => {
  // Kiểm tra logic mapTicket trực tiếp từ ticket.service (pure logic, no DB)
  const { mapTicket } = require('../../src/services/ticket.service.js');

  const futureEvent = {
    ma_su_kien: 10,
    ten_su_kien: 'Sự kiện tương lai',
    dia_diem: 'Hall A',
    phong: 'B201',
    ngay_dien_ra: '2030-01-01',
    thoi_gian_bat_dau: '08:00:00',
    thoi_gian_ket_thuc: '10:00:00',
    trang_thai_su_kien: 'SapToChuc',
    da_xoa: false,
  };

  const ongoingEvent = {
    ...futureEvent,
    ngay_dien_ra: new Date().toISOString().slice(0, 10),
    thoi_gian_bat_dau: '00:00:00',
    thoi_gian_ket_thuc: '23:59:00',
    trang_thai_su_kien: 'DangDienRa',
  };

  test('S6.1 - Vé DaDangKy + sự kiện SapToChuc (tương lai) → canCancel=true, canShowQr=true, group=upcoming', () => {
    const ticket = { ma_dang_ky: 1, ma_qr_code: 'qr-abc', trang_thai_ve: 'DaDangKy', thoi_gian_tao: new Date().toISOString(), thoi_gian_check_in: null, thoi_gian_huy: null, su_kien: futureEvent };
    const result = mapTicket(ticket, new Date('2026-10-06T00:00:00Z'));

    expect(result.canCancel).toBe(true);
    expect(result.canShowQr).toBe(true);
    expect(result.group).toBe('upcoming');
  });

  test('S6.2 - Vé DaCheckIn → canCancel=false, group=history', () => {
    const ticket = { ma_dang_ky: 2, ma_qr_code: 'qr-xyz', trang_thai_ve: 'DaCheckIn', thoi_gian_tao: new Date().toISOString(), thoi_gian_check_in: new Date().toISOString(), thoi_gian_huy: null, su_kien: futureEvent };
    const result = mapTicket(ticket, new Date('2026-10-06T00:00:00Z'));

    expect(result.canCancel).toBe(false);
    expect(result.group).toBe('history');
  });

  test('S6.3 - Vé DaDangKy + sự kiện DangDienRa (đang trong giờ) → canCancel=false, canShowQr=true (AC-3.4)', () => {
    const now = new Date();
    const ticket = { ma_dang_ky: 3, ma_qr_code: 'qr-123', trang_thai_ve: 'DaDangKy', thoi_gian_tao: new Date().toISOString(), thoi_gian_check_in: null, thoi_gian_huy: null, su_kien: ongoingEvent };
    const result = mapTicket(ticket, now);

    // Sự kiện đang diễn ra → không được hủy vé
    expect(result.canCancel).toBe(false);
    // Nhưng QR vẫn hiển thị để check-in
    expect(result.canShowQr).toBe(true);
  });

  test('S6.4 - Vé DaHuy → canCancel=false, canShowQr=false', () => {
    const ticket = { ma_dang_ky: 4, ma_qr_code: 'qr-huy', trang_thai_ve: 'DaHuy', thoi_gian_tao: new Date().toISOString(), thoi_gian_check_in: null, thoi_gian_huy: new Date().toISOString(), su_kien: futureEvent };
    const result = mapTicket(ticket, new Date('2026-10-06T00:00:00Z'));

    expect(result.canCancel).toBe(false);
    expect(result.canShowQr).toBe(false);
    expect(result.group).toBe('history');
  });
});
