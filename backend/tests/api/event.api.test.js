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
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(resolved),
    single: jest.fn().mockResolvedValue(resolved),
    maybeSingle: jest.fn().mockResolvedValue(resolved),
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

describe('POST /api/events/upload-banner', () => {
  beforeEach(() => jest.clearAllMocks());

  test('G2.1 - Tải ảnh bìa sự kiện thất bại nếu thiếu fileData', async () => {
    const { generateAccessToken } = require('../../src/utils/jwt.js');
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    const token = generateAccessToken({ ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc' });

    supabase.from.mockImplementation((table) => {
      if (table === 'tai_khoan') {
        return makeChain({ data: { ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false } });
      }
      return makeChain({ data: null });
    });

    const res = await request(app)
      .post('/api/events/upload-banner')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('G2.2 - Tải ảnh bìa sự kiện thành công', async () => {
    const { generateAccessToken } = require('../../src/utils/jwt.js');
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    const token = generateAccessToken({ ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc' });

    supabase.from.mockImplementation((table) => {
      if (table === 'tai_khoan') {
        return makeChain({ data: { ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false } });
      }
      return makeChain({ data: null });
    });

    const res = await request(app)
      .post('/api/events/upload-banner')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fileName: 'test.png',
        mimeType: 'image/png'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('url');
  });
});

describe('Validation & Dynamic Status Tests (Gói 2)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('G2.3 - Báo lỗi khi tạo sự kiện trong quá khứ', async () => {
    const { generateAccessToken } = require('../../src/utils/jwt.js');
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    const token = generateAccessToken({ ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc' });

    supabase.from.mockImplementation((table) => {
      if (table === 'tai_khoan') {
        return makeChain({ data: { ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false } });
      }
      return makeChain({ data: null });
    });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ten_su_kien: 'Sự kiện quá khứ',
        ma_chuyen_de: 1,
        dia_diem: 'Cơ sở 1',
        phong: 'Phòng A101',
        ngay_dien_ra: '2020-01-01',
        thoi_gian_bat_dau: '08:00',
        thoi_gian_ket_thuc: '10:00',
        so_luong_toi_da: 50,
        trang_thai_su_kien: 'SapToChuc'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Thời gian bắt đầu sự kiện phải diễn ra trong tương lai');
  });

  test('G2.4 - Tính toán trạng thái động khi trả về sự kiện', async () => {
    const { generateAccessToken } = require('../../src/utils/jwt.js');
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    const token = generateAccessToken({ ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc' });

    const pastEvent = {
      ma_su_kien: 10,
      ten_su_kien: 'Sự kiện đã qua',
      trang_thai_su_kien: 'SapToChuc',
      ngay_dien_ra: '2020-01-01',
      thoi_gian_bat_dau: '08:00',
      thoi_gian_ket_thuc: '10:00',
      dang_ky: [{ count: 5 }]
    };

    supabase.from.mockImplementation((table) => {
      if (table === 'tai_khoan') {
        return makeChain({ data: { ma_tai_khoan: 1, loai_tai_khoan: 'ToChuc', trang_thai_tai_khoan: 'HoatDong', da_xoa: false } });
      }
      return makeChain({ data: [pastEvent] });
    });

    const res = await request(app)
      .get('/api/organizer/events')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].trang_thai_su_kien).toBe('DaKetThuc');
  });

  test('G2.5 - Tính toán trạng thái DangDienRa cho sự kiện đang trong khung giờ (định dạng DD/MM/YYYY và YYYY-MM-DD)', () => {
    const { computeEventStatus } = require('../../src/utils/eventStatus.js');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const formattedSlashDate = `${dd}/${mm}/${yyyy}`; // DD/MM/YYYY

    // Tạo thời gian bắt đầu 10 phút trước và kết thúc 20 phút sau
    const startTime = new Date(today.getTime() - 10 * 60 * 1000);
    const endTime = new Date(today.getTime() + 20 * 60 * 1000);

    const startStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const endStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    const ongoingEvent = {
      ma_su_kien: 99,
      ten_su_kien: 'Hội thảo AI Engineer',
      trang_thai_su_kien: 'SapToChuc',
      ngay_dien_ra: formattedSlashDate,
      thoi_gian_bat_dau: startStr,
      thoi_gian_ket_thuc: endStr,
    };

    const status = computeEventStatus(ongoingEvent);
    expect(status).toBe('DangDienRa');
  });

  test('G2.6 - Tôn trọng trạng thái thủ công BanNhap và DaKetThuc', () => {
    const { computeEventStatus } = require('../../src/utils/eventStatus.js');
    
    // Sự kiện bản nháp không bao giờ bị tự đổi trạng thái
    const draftEvent = {
      ma_su_kien: 101,
      trang_thai_su_kien: 'BanNhap',
      ngay_dien_ra: '2020-01-01',
      thoi_gian_bat_dau: '08:00',
      thoi_gian_ket_thuc: '10:00'
    };
    expect(computeEventStatus(draftEvent)).toBe('BanNhap');

    // Sự kiện đã kết thúc/hủy thủ công không bị ghi đè
    const endedEvent = {
      ma_su_kien: 102,
      trang_thai_su_kien: 'DaKetThuc',
      ngay_dien_ra: '2030-01-01',
      thoi_gian_bat_dau: '08:00',
      thoi_gian_ket_thuc: '10:00'
    };
    expect(computeEventStatus(endedEvent)).toBe('DaKetThuc');
  });
});
