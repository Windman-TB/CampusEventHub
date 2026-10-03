/**
 * API Integration Tests cho Event endpoints (Public) - Gói 3
 *
 * Strategy: Mock supabase.from()
 */

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app.js');
const supabase = require('../../src/config/supabase.js');

// ─── MOCK BUILDER ─────────────────────────────────────────────────────────────

function makeChain({ data = null, error = null, count = 0 } = {}) {
  const resolved = { data, error, count };
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(resolved),
    single: jest.fn().mockResolvedValue(resolved),
    then: jest.fn((resolve) => resolve(resolved)),
  };
}

describe('GET /api/events (Gói 3)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('G3.1 - Lấy danh sách sự kiện public thành công', async () => {
    const mockEvents = [
      {
        ma_su_kien: 1,
        ten_su_kien: 'Sự kiện 1',
        dang_ky: [{ count: 10 }],
        so_luong_toi_da: 100
      }
    ];

    supabase.from.mockImplementation(() => makeChain({ data: mockEvents }));

    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events).toHaveLength(1);
    expect(res.body.data.events[0]).toMatchObject({
      ma_su_kien: 1,
      so_ve_da_dat: 10,
      so_ve_con_lai: 90
    });
  });

  test('G3.2 - Tìm kiếm sự kiện theo keyword, ngay_dien_ra, dia_diem', async () => {
    supabase.from.mockImplementation(() => makeChain({ data: [] }));

    const res = await request(app).get('/api/events?keyword=UIT&ngay_dien_ra=2026-10-10&dia_diem=Hall');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events).toHaveLength(0);
  });
});

describe('GET /api/events/:id (Gói 3)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('G3.3 - Lấy chi tiết sự kiện thành công', async () => {
    const mockEvent = {
      ma_su_kien: 1,
      ten_su_kien: 'Chi tiết sự kiện',
      dang_ky: [{ count: 5 }]
    };

    supabase.from.mockImplementation(() => makeChain({ data: mockEvent }));

    const res = await request(app).get('/api/events/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('ten_su_kien', 'Chi tiết sự kiện');
    expect(res.body.data).toHaveProperty('so_ve_da_dat', 5);
  });

  test('G3.4 - ID không hợp lệ -> 400', async () => {
    const res = await request(app).get('/api/events/abc');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('G3.5 - Không tìm thấy sự kiện -> 404', async () => {
    // Trả về error có code PGRST116 (0 rows)
    supabase.from.mockImplementation(() => makeChain({ error: { code: 'PGRST116' } }));

    const res = await request(app).get('/api/events/999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
