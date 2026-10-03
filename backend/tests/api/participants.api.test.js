/**
 * API Integration Tests cho Participants endpoints
 * Dùng Supertest để test HTTP layer thật (Express routing, middleware, controller)
 * Mock supabase client để không cần kết nối DB thật
 */

jest.mock('../../src/config/supabase.js', () => {
  const mockFrom = jest.fn();
  return { from: mockFrom };
});

const request = require('supertest');
const app = require('../../src/app.js');
const supabase = require('../../src/config/supabase.js');

// Mock JWT verify để không cần token thật
jest.mock('../../src/utils/jwt.js', () => ({
  verifyAccessToken: jest.fn(),
}));
const { verifyAccessToken } = require('../../src/utils/jwt.js');

// Helper tạo token cho ToChuc role
const ORGANIZER_USER_ID = 5;
function mockOrganizerAuth() {
  verifyAccessToken.mockReturnValue({ sub: String(ORGANIZER_USER_ID) });
  // Mock DB lookup user trong auth middleware
  supabase.from.mockImplementation((table) => {
    if (table === 'tai_khoan') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            ma_tai_khoan: ORGANIZER_USER_ID,
            mssv: null,
            email: 'organizer@test.com',
            ho_ten: 'Ban To Chuc',
            loai_tai_khoan: 'ToChuc',
            trang_thai_tai_khoan: 'HoatDong',
            da_xoa: false,
          },
          error: null,
        }),
      };
    }
    return buildParticipantChain();
  });
}

function buildParticipantChain(overrides = {}) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({
      data: overrides.data ?? [],
      error: overrides.error ?? null,
      count: overrides.count ?? 0,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: overrides.single ?? null,
      error: overrides.error ?? null,
    }),
    single: jest.fn().mockResolvedValue({
      data: overrides.single ?? null,
      error: overrides.error ?? null,
    }),
  };
}

describe('GET /api/organizer/events/:id/participants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('A1.1 - Không có token → 401', async () => {
    const res = await request(app).get('/api/organizer/events/1/participants');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('A1.2 - Token role SinhVien → 403', async () => {
    verifyAccessToken.mockReturnValue({ sub: '10' });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          ma_tai_khoan: 10,
          loai_tai_khoan: 'SinhVien',
          trang_thai_tai_khoan: 'HoatDong',
          da_xoa: false,
        },
        error: null,
      }),
    });

    const res = await request(app)
      .get('/api/organizer/events/1/participants')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('A1.3 - Token ToChuc hợp lệ → 200, data là array', async () => {
    const sampleData = [
      {
        ma_dang_ky: 1, ma_qr_code: 'uuid-1', trang_thai_ve: 'DaDangKy',
        thoi_gian_tao: '2024-01-01', thoi_gian_check_in: null, thoi_gian_huy: null, ghi_chu: null,
        tai_khoan: { ma_tai_khoan: 10, mssv: '22521001', ho_ten: 'Test User', email: 't@test.com', khoa: 'CNTT' },
      },
    ];

    let callCount = 0;
    supabase.from.mockImplementation((table) => {
      callCount++;
      if (table === 'tai_khoan' && callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { ma_tai_khoan: ORGANIZER_USER_ID, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: sampleData, error: null, count: 1 }),
      };
    });
    verifyAccessToken.mockReturnValue({ sub: String(ORGANIZER_USER_ID) });

    const res = await request(app)
      .get('/api/organizer/events/1/participants')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta).toHaveProperty('total');
  });

  test('A1.4 - ID không phải số → 400', async () => {
    verifyAccessToken.mockReturnValue({ sub: String(ORGANIZER_USER_ID) });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { ma_tai_khoan: ORGANIZER_USER_ID, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false },
        error: null,
      }),
    });

    const res = await request(app)
      .get('/api/organizer/events/abc/participants')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ID');
  });
});

describe('PATCH /api/organizer/tickets/:id/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('A1.5 - Không có token → 401', async () => {
    const res = await request(app)
      .patch('/api/organizer/tickets/1/status')
      .send({ trang_thai_ve: 'DaCheckIn' });
    expect(res.status).toBe(401);
  });

  test('A1.6 - Thiếu body trang_thai_ve → 400', async () => {
    verifyAccessToken.mockReturnValue({ sub: String(ORGANIZER_USER_ID) });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { ma_tai_khoan: ORGANIZER_USER_ID, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false },
        error: null,
      }),
    });

    const res = await request(app)
      .patch('/api/organizer/tickets/1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_STATUS');
  });

  test('A1.7 - Ticket không tồn tại → 404', async () => {
    let callCount = 0;
    verifyAccessToken.mockReturnValue({ sub: String(ORGANIZER_USER_ID) });
    supabase.from.mockImplementation((table) => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { ma_tai_khoan: ORGANIZER_USER_ID, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false },
            error: null,
          }),
        };
      }
      // Ticket not found
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const res = await request(app)
      .patch('/api/organizer/tickets/9999/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ trang_thai_ve: 'DaCheckIn' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('TICKET_NOT_FOUND');
  });

  test('A1.8 - Status không hợp lệ → 400 INVALID_STATUS', async () => {
    verifyAccessToken.mockReturnValue({ sub: String(ORGANIZER_USER_ID) });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { ma_tai_khoan: ORGANIZER_USER_ID, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false },
        error: null,
      }),
    });

    const res = await request(app)
      .patch('/api/organizer/tickets/1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ trang_thai_ve: 'TrangThaiSai' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_STATUS');
  });
});
