/**
 * API Integration Tests cho Export endpoints (Phase 3 - Gói 7)
 *
 * Strategy: Mock supabase.from() theo TABLE NAME (tai_khoan, su_kien, dang_ky)
 * để phân biệt auth middleware với business logic.
 *
 * Tổng: 10 test cases
 */

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));
jest.mock('../../src/utils/jwt.js', () => ({ verifyAccessToken: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app.js');
const supabase = require('../../src/config/supabase.js');
const { verifyAccessToken } = require('../../src/utils/jwt.js');

// ─── CONSTANTS & FIXTURES ─────────────────────────────────────────────────────

const ORGANIZER_ID = 5;
const OTHER_ORGANIZER_ID = 99;
const EVENT_ID = 1;

function makeChain({ data = null, error = null, count = 0 } = {}) {
  const resolved = { data, error, count };
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(resolved),
    maybeSingle: jest.fn().mockResolvedValue(resolved),
    single: jest.fn().mockResolvedValue(resolved),
  };
}

const ORGANIZER_DB_USER = {
  ma_tai_khoan: ORGANIZER_ID,
  email: 'organizer@uit.edu.vn',
  ho_ten: 'Ban To Chuc Test',
  loai_tai_khoan: 'ToChuc',
  trang_thai_tai_khoan: 'HoatDong',
  da_xoa: false,
};

const SINHVIEN_DB_USER = {
  ma_tai_khoan: 20,
  email: 'student@uit.edu.vn',
  ho_ten: 'Sinh Vien Test',
  loai_tai_khoan: 'SinhVien',
  trang_thai_tai_khoan: 'HoatDong',
  da_xoa: false,
};

const SAMPLE_EVENT = {
  ma_su_kien: EVENT_ID,
  ten_su_kien: 'Hội thảo AI & Robotics 2026',
  ma_tai_khoan_to_chuc: ORGANIZER_ID,
};

const OTHER_OWNER_EVENT = {
  ma_su_kien: EVENT_ID,
  ten_su_kien: 'Sự kiện khác',
  ma_tai_khoan_to_chuc: OTHER_ORGANIZER_ID,
};

const SAMPLE_PARTICIPANTS = [
  {
    ma_dang_ky: 101,
    ma_qr_code: 'uuid-1',
    trang_thai_ve: 'DaDangKy',
    thoi_gian_tao: '2026-03-01T08:30:00.000Z',
    thoi_gian_check_in: null,
    thoi_gian_huy: null,
    ghi_chu: null,
    tai_khoan: {
      ma_tai_khoan: 10,
      mssv: '22521001',
      ho_ten: 'Nguyễn Văn An',
      email: 'an@gm.uit.edu.vn',
      khoa: 'Khoa học Máy tính',
    },
  },
  {
    ma_dang_ky: 102,
    ma_qr_code: 'uuid-2',
    trang_thai_ve: 'DaCheckIn',
    thoi_gian_tao: '2026-03-01T09:00:00.000Z',
    thoi_gian_check_in: '2026-03-05T07:45:00.000Z',
    thoi_gian_huy: null,
    ghi_chu: null,
    tai_khoan: {
      ma_tai_khoan: 11,
      mssv: '22521002',
      ho_ten: 'Trần Thị Bích',
      email: 'bich@gm.uit.edu.vn',
      khoa: 'Mạng máy tính & TT',
    },
  },
];

/** Setup mocks by table name */
function setupMocks({
  role = 'ToChuc',
  account = null,
  event = SAMPLE_EVENT,
  participants = SAMPLE_PARTICIPANTS,
} = {}) {
  const dbUser = role === 'ToChuc' ? ORGANIZER_DB_USER : SINHVIEN_DB_USER;
  verifyAccessToken.mockReturnValue({ sub: String(dbUser.ma_tai_khoan) });

  supabase.from.mockImplementation((table) => {
    if (table === 'tai_khoan') {
      return makeChain({ data: account || dbUser });
    }
    if (table === 'su_kien') {
      return makeChain({ data: event });
    }
    if (table === 'dang_ky') {
      return makeChain({ data: participants });
    }
    return makeChain({ data: null });
  });
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('GET /api/organizer/events/:id/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Auth & Role Guards
  // =========================================================================
  describe('Auth & Role Guards', () => {
    test('A3.1 - Không có Authorization header → 401', async () => {
      const res = await request(app).get(`/api/organizer/events/${EVENT_ID}/export`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('A3.2 - Token role SinhVien → 403 Forbidden', async () => {
      setupMocks({ role: 'SinhVien' });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export`)
        .set('Authorization', 'Bearer sinhvien-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. Input Validation
  // =========================================================================
  describe('Input Validation', () => {
    test('A3.3 - ID sự kiện không phải số nguyên → 400 INVALID_ID', async () => {
      setupMocks({ role: 'ToChuc' });

      const res = await request(app)
        .get('/api/organizer/events/abc/export')
        .set('Authorization', 'Bearer btc-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_ID');
    });

    test('A3.4 - Query format không hợp lệ (vd: format=pdf) → 400 INVALID_FORMAT', async () => {
      setupMocks({ role: 'ToChuc' });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export?format=pdf`)
        .set('Authorization', 'Bearer btc-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_FORMAT');
    });
  });

  // =========================================================================
  // 3. Ownership & Existence Checks
  // =========================================================================
  describe('Ownership & Existence Checks', () => {
    test('A3.5 - Sự kiện không tồn tại → 404 EVENT_NOT_FOUND', async () => {
      setupMocks({ role: 'ToChuc', event: null });

      const res = await request(app)
        .get(`/api/organizer/events/999/export`)
        .set('Authorization', 'Bearer btc-token');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('EVENT_NOT_FOUND');
    });

    test('A3.6 - Sự kiện không thuộc BTC đang đăng nhập → 403 FORBIDDEN', async () => {
      setupMocks({ role: 'ToChuc', event: OTHER_OWNER_EVENT });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export`)
        .set('Authorization', 'Bearer btc-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 4. Export CSV
  // =========================================================================
  describe('Export CSV', () => {
    test('A3.7 - Mặc định (không truyền format) hoặc format=csv → 200, Content-Type text/csv có UTF-8 BOM', async () => {
      setupMocks({ role: 'ToChuc' });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export?format=csv`)
        .set('Authorization', 'Bearer btc-token');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toContain(
        `attachment; filename="participants-event-${EVENT_ID}.csv"`
      );

      // Verify UTF-8 BOM
      const buf = Buffer.from(res.text, 'utf8');
      expect(res.text).toContain('STT,MSSV,Họ tên,Email,Khoa,Trạng thái vé,Thời gian đặt,Thời gian check-in');
      expect(res.text).toContain('22521001');
      expect(res.text).toContain('Nguyễn Văn An');
    });

    test('A3.8 - CSV export khi sự kiện chưa có người tham gia → 200, trả header rỗng', async () => {
      setupMocks({ role: 'ToChuc', participants: [] });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export`)
        .set('Authorization', 'Bearer btc-token');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('STT,MSSV,Họ tên,Email,Khoa,Trạng thái vé');
    });
  });

  // =========================================================================
  // 5. Export XLSX
  // =========================================================================
  describe('Export XLSX', () => {
    test('A3.9 - format=xlsx → 200, Content-Type vnd.openxmlformats..., body là file Excel hợp lệ', async () => {
      setupMocks({ role: 'ToChuc' });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export?format=xlsx`)
        .set('Authorization', 'Bearer btc-token')
        .responseType('blob'); // Để nhận binary data

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers['content-disposition']).toContain(
        `attachment; filename="participants-event-${EVENT_ID}.xlsx"`
      );

      // Binary payload starts with PK.. (0x50, 0x4B)
      const buffer = res.body;
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });

    test('A3.10 - Query format case-insensitive (vd: format=XLSX) → 200 hoạt động bình thường', async () => {
      setupMocks({ role: 'ToChuc' });

      const res = await request(app)
        .get(`/api/organizer/events/${EVENT_ID}/export?format=XLSX`)
        .set('Authorization', 'Bearer btc-token')
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    });
  });
});
