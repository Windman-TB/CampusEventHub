/**
 * API Integration Tests cho Staff endpoints (Phase 2 - Gói 7)
 *
 * Strategy: Mock supabase.from() theo TABLE NAME để phân biệt
 * auth middleware query (tai_khoan) với business logic query
 *
 * Tổng: 18 test cases
 */

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));
jest.mock('../../src/utils/jwt.js', () => ({ verifyAccessToken: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app.js');
const supabase = require('../../src/config/supabase.js');
const { verifyAccessToken } = require('../../src/utils/jwt.js');

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ORGANIZER_ID = 5;
const EVENT_ID = 1;
const STAFF_ID = 1;
const TARGET_USER_ID = 10;

// ─── MOCK BUILDER ─────────────────────────────────────────────────────────────

/**
 * Tạo chain mock linh hoạt, hỗ trợ nhiều terminal resolvers
 * Mỗi terminal (limit/range/maybeSingle/single) trả về cùng resolved value
 */
function makeChain({ data = null, error = null, count = 0 } = {}) {
  const resolved = { data, error, count };
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    // Terminal resolvers
    limit: jest.fn().mockResolvedValue(resolved),
    range: jest.fn().mockResolvedValue(resolved),
    maybeSingle: jest.fn().mockResolvedValue(resolved),
    single: jest.fn().mockResolvedValue(resolved),
  };
}

// Data fixtures
const ORGANIZER_DB_USER = {
  ma_tai_khoan: ORGANIZER_ID,
  mssv: null,
  email: 'organizer@uit.edu.vn',
  ho_ten: 'Ban To Chuc Test',
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
const EVENT_OWNED = { ma_su_kien: EVENT_ID, ma_tai_khoan_to_chuc: ORGANIZER_ID };
const EVENT_OTHER = { ma_su_kien: EVENT_ID, ma_tai_khoan_to_chuc: 99 };
const TARGET_ACCOUNT_ACTIVE = {
  ma_tai_khoan: TARGET_USER_ID,
  ho_ten: 'Test Student',
  mssv: '22521001',
  trang_thai_tai_khoan: 'HoatDong',
};
const NEW_STAFF_INSERT = {
  ma_nhan_vien: STAFF_ID,
  thoi_gian_tao: '2024-01-01T00:00:00Z',
  tai_khoan: {
    ma_tai_khoan: TARGET_USER_ID,
    mssv: '22521001',
    ho_ten: 'Test Student',
    email: 'test@gm.uit.edu.vn',
    khoa: 'CNTT',
    loai_tai_khoan: 'SinhVien',
  },
};
const STAFF_ROW = {
  ma_nhan_vien: STAFF_ID,
  thoi_gian_tao: '2024-01-01T00:00:00Z',
  tai_khoan: {
    ma_tai_khoan: TARGET_USER_ID,
    mssv: '22521001',
    ho_ten: 'Test Student',
    email: 'test@gm.uit.edu.vn',
    khoa: 'CNTT',
    loai_tai_khoan: 'SinhVien',
  },
};

/**
 * Setup auth + business logic mocks theo table routing
 *
 * @param {object} options
 * @param {string} options.role - 'ToChuc' | 'SinhVien'
 * @param {object} options.suKien - event data (null = not found)
 * @param {object} options.targetAccount - account to assign (null = not found)
 * @param {object} options.existingStaff - existing staff record (null = not found)
 * @param {object} options.newStaff - insert result
 * @param {array}  options.staffList - list for GET staff
 * @param {array}  options.studentList - search result
 * @param {object} options.staffRecord - for delete fetch
 * @param {object} options.updateResult - for delete update
 */
function setupAuth(role = 'ToChuc') {
  const dbUser = role === 'ToChuc' ? ORGANIZER_DB_USER : SINHVIEN_DB_USER;
  verifyAccessToken.mockReturnValue({ sub: String(dbUser.ma_tai_khoan) });

  // Auth middleware chỉ query tai_khoan một lần
  supabase.from.mockReset();
  supabase.from.mockImplementation(() =>
    makeChain({ data: dbUser })
  );
}

/**
 * Setup FIFO Supabase responses, starting with authentication then service calls.
 */
function setupFullMock({ role = 'ToChuc', calls = [] } = {}) {
  const dbUser = role === 'ToChuc' ? ORGANIZER_DB_USER : SINHVIEN_DB_USER;
  verifyAccessToken.mockReturnValue({ sub: String(dbUser.ma_tai_khoan) });

  // Reset queued implementations so early-return requests cannot leak fixture
  // responses into the next test.
  const responses = [
    { data: dbUser },
    ...calls,
  ];
  supabase.from.mockReset();
  supabase.from.mockImplementation(() => {
    const { data = null, error = null, count = 0 } = responses.shift() || {};
    return makeChain({ data, error, count });
  });
}

// ─── AUTH GUARD TESTS ─────────────────────────────────────────────────────────

describe('Auth guard cho tất cả staff endpoints', () => {
  beforeEach(() => jest.clearAllMocks());

  test('A2.1 - Không có Authorization header → 401 cho tất cả endpoints', async () => {
    const endpoints = [
      { method: 'get', path: '/api/organizer/students/search?query=22521' },
      { method: 'get', path: `/api/organizer/events/${EVENT_ID}/staff` },
      { method: 'post', path: `/api/organizer/events/${EVENT_ID}/staff` },
      { method: 'delete', path: `/api/organizer/events/${EVENT_ID}/staff/${STAFF_ID}` },
    ];

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  test('A2.2 - Token role SinhVien → 403 (không có quyền ToChuc)', async () => {
    setupAuth('SinhVien');

    const res = await request(app)
      .get(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer sv-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/organizer/students/search ──────────────────────────────────────

describe('GET /api/organizer/students/search', () => {
  beforeEach(() => jest.clearAllMocks());

  test('A2.3 - query quá ngắn (< 2 chars) → 200 data rỗng, không query DB business', async () => {
    setupAuth('ToChuc');

    const res = await request(app)
      .get('/api/organizer/students/search?query=2')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    // Service phải chỉ gọi 1 lần (auth lookup), không có business query
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  test('A2.4 - query hợp lệ → 200, trả về danh sách sinh viên', async () => {
    const students = [
      { ma_tai_khoan: 10, mssv: '22521001', ho_ten: 'Test User', email: 'a@test.com', khoa: 'CNTT', loai_tai_khoan: 'SinhVien' },
    ];
    setupFullMock({ calls: [{ data: students }] });

    const res = await request(app)
      .get('/api/organizer/students/search?query=22521')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ mssv: '22521001', ho_ten: 'Test User' });
  });

  test('A2.5 - query không tìm thấy → 200 data rỗng, message "Không tìm thấy"', async () => {
    setupFullMock({ calls: [{ data: [] }] });

    const res = await request(app)
      .get('/api/organizer/students/search?query=zzzzz')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.message).toContain('Không tìm thấy');
  });
});

// ─── GET /api/organizer/events/:id/staff ────────────────────────────────────

describe('GET /api/organizer/events/:id/staff', () => {
  beforeEach(() => jest.clearAllMocks());

  test('A2.6 - ID sự kiện không phải số → 400 INVALID_ID', async () => {
    setupAuth('ToChuc');

    const res = await request(app)
      .get('/api/organizer/events/abc/staff')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ID');
  });

  test('A2.7 - Sự kiện không thuộc BTC đang đăng nhập → 403 FORBIDDEN', async () => {
    // Call 0: auth, Call 1: event lookup (thuộc actor khác)
    setupFullMock({ calls: [{ data: EVENT_OTHER }] });

    const res = await request(app)
      .get(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  test('A2.8 - Sự kiện hợp lệ, chưa có staff → 200 data rỗng', async () => {
    // Call 0: auth, Call 1: event ownership check, Call 2: staff list
    setupFullMock({ calls: [{ data: EVENT_OWNED }, { data: [] }] });

    const res = await request(app)
      .get(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  test('A2.9 - Sự kiện có staff → 200, data flatten không có nested tai_khoan', async () => {
    setupFullMock({ calls: [{ data: EVENT_OWNED }, { data: [STAFF_ROW] }] });

    const res = await request(app)
      .get(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ mssv: '22521001', ma_nhan_vien: STAFF_ID });
    expect(res.body.data[0]).not.toHaveProperty('tai_khoan');
  });
});

// ─── POST /api/organizer/events/:id/staff ────────────────────────────────────

describe('POST /api/organizer/events/:id/staff', () => {
  beforeEach(() => jest.clearAllMocks());

  test('A2.10 - Body thiếu ma_tai_khoan → 400 MISSING_FIELD', async () => {
    setupAuth('ToChuc');

    const res = await request(app)
      .post(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_FIELD');
  });

  test('A2.11 - ma_tai_khoan là chuỗi không phải số → 400 INVALID_FIELD', async () => {
    setupAuth('ToChuc');

    const res = await request(app)
      .post(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token')
      .send({ ma_tai_khoan: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_FIELD');
  });

  test('A2.12 - Tài khoản không tồn tại → 404 STUDENT_NOT_FOUND', async () => {
    // Call 0: auth, 1: event, 2: account (null)
    setupFullMock({
      calls: [{ data: EVENT_OWNED }, { data: null }],
    });

    const res = await request(app)
      .post(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token')
      .send({ ma_tai_khoan: 9999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('STUDENT_NOT_FOUND');
  });

  test('A2.13 - Sinh viên đã được gán (active) → 409 ALREADY_ASSIGNED', async () => {
    // Call 0: auth, 1: event, 2: account (active), 3: existing staff (found)
    setupFullMock({
      calls: [
        { data: EVENT_OWNED },
        { data: TARGET_ACCOUNT_ACTIVE },
        { data: { ma_nhan_vien: 99 } },  // existing staff record found
      ],
    });

    const res = await request(app)
      .post(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token')
      .send({ ma_tai_khoan: TARGET_USER_ID });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_ASSIGNED');
  });

  test('A2.14 - Phân công thành công → 201, data có ma_nhan_vien và mssv', async () => {
    // Call 0: auth, 1: event, 2: account, 3: existing staff (null), 4: insert result
    setupFullMock({
      calls: [
        { data: EVENT_OWNED },
        { data: TARGET_ACCOUNT_ACTIVE },
        { data: null },           // no existing staff
        { data: NEW_STAFF_INSERT }, // insert result
      ],
    });

    const res = await request(app)
      .post(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token')
      .send({ ma_tai_khoan: TARGET_USER_ID });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('ma_nhan_vien', STAFF_ID);
    expect(res.body.data).toHaveProperty('mssv', '22521001');
    expect(res.body.data).not.toHaveProperty('tai_khoan');
    expect(res.body.message).toContain('Test Student');
  });

  test('A2.14b - Unique index chặn request đua nhau → 409 ALREADY_ASSIGNED', async () => {
    setupFullMock({
      calls: [
        { data: EVENT_OWNED },
        { data: TARGET_ACCOUNT_ACTIVE },
        { data: null },
        { data: null, error: { code: '23505', message: 'duplicate key' } },
      ],
    });

    const res = await request(app)
      .post(`/api/organizer/events/${EVENT_ID}/staff`)
      .set('Authorization', 'Bearer valid-token')
      .send({ ma_tai_khoan: TARGET_USER_ID });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_ASSIGNED');
  });
});

// ─── DELETE /api/organizer/events/:id/staff/:staffId ─────────────────────────

describe('DELETE /api/organizer/events/:id/staff/:staffId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('A2.15 - staffId không phải số → 400 INVALID_ID', async () => {
    setupAuth('ToChuc');

    const res = await request(app)
      .delete(`/api/organizer/events/${EVENT_ID}/staff/abc`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ID');
  });

  test('A2.16 - Staff không tồn tại trong sự kiện → 404 STAFF_NOT_FOUND', async () => {
    // Call 0: auth, 1: event, 2: staff record (null)
    setupFullMock({
      calls: [{ data: EVENT_OWNED }, { data: null }],
    });

    const res = await request(app)
      .delete(`/api/organizer/events/${EVENT_ID}/staff/999`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('STAFF_NOT_FOUND');
  });

  test('A2.17 - Thu hồi thành công → 200, data.revoked=true, data.ma_nhan_vien đúng', async () => {
    // Call 0: auth, 1: event, 2: staff record, 3: update result
    setupFullMock({
      calls: [
        { data: EVENT_OWNED },
        { data: { ma_nhan_vien: STAFF_ID, ma_su_kien: EVENT_ID, da_xoa: false } },
        { data: { ma_nhan_vien: STAFF_ID } },  // update result
      ],
    });

    const res = await request(app)
      .delete(`/api/organizer/events/${EVENT_ID}/staff/${STAFF_ID}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ revoked: true, ma_nhan_vien: STAFF_ID });
    expect(res.body.message).toContain('thu hồi');
  });

  test('A2.18 - BTC không sở hữu sự kiện → 403 FORBIDDEN', async () => {
    // Call 0: auth, 1: event ownership check (belongs to other actor)
    setupFullMock({ calls: [{ data: EVENT_OTHER }] });

    const res = await request(app)
      .delete(`/api/organizer/events/${EVENT_ID}/staff/${STAFF_ID}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });
});
