/**
 * Unit Tests cho staff.service.js
 *
 * Coverage targets:
 *   - searchStudents: query ngắn, exact MSSV, tên, case-insensitive, DB error
 *   - _verifyEventOwnership: not found, forbidden, success
 *   - getStaffByEvent: ownership fail, success, empty list
 *   - assignStaff: ownership fail, account not found, account locked, already assigned, success
 *   - revokeStaff: ownership fail, staff not found, success
 *
 * Tổng: 21 test cases
 */

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));

const supabase = require('../../src/config/supabase.js');
const {
  searchStudents,
  getStaffByEvent,
  assignStaff,
  revokeStaff,
  _verifyEventOwnership,
} = require('../../src/services/staff.service.js');

// ─── MOCK FACTORIES ──────────────────────────────────────────────────────────

/** Tạo chain mock trả về resolved value ngay ở cuối */
const chain = (resolved) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  // Terminal resolvers
  limit: jest.fn().mockResolvedValue(resolved),
  range: jest.fn().mockResolvedValue(resolved),
  maybeSingle: jest.fn().mockResolvedValue(resolved),
  single: jest.fn().mockResolvedValue(resolved),
  // For insert/update chains
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
});

/** Tạo multi-step mock: từng lần gọi supabase.from() trả về chain riêng */
function mockSequence(...resolvedValues) {
  let callIdx = 0;
  supabase.from.mockImplementation(() => {
    const val = resolvedValues[callIdx] ?? resolvedValues[resolvedValues.length - 1];
    callIdx++;
    return chain(val);
  });
}

const OK_EVENT = { data: { ma_su_kien: 1, ma_tai_khoan_to_chuc: 5 }, error: null };
const OK_ACCOUNT = {
  data: { ma_tai_khoan: 10, ho_ten: 'Nguyễn Test', mssv: '22521001', trang_thai_tai_khoan: 'HoatDong' },
  error: null,
};
const OK_STAFF_ROW = {
  data: {
    ma_nhan_vien: 1,
    thoi_gian_tao: '2024-01-01',
    tai_khoan: { ma_tai_khoan: 10, mssv: '22521001', ho_ten: 'Nguyễn Test', email: 'a@test.com', khoa: 'CNTT', loai_tai_khoan: 'SinhVien' },
  },
  error: null,
};
const NOT_FOUND = { data: null, error: null };
const DB_ERROR = { data: null, error: new Error('DB connection failed') };

// ─── searchStudents ───────────────────────────────────────────────────────────

describe('searchStudents', () => {
  beforeEach(() => jest.clearAllMocks());

  test('U2.1 - query quá ngắn (< 2 chars) → trả về [] ngay, không query DB', async () => {
    const result = await searchStudents('2');
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('U2.2 - query rỗng → trả về [] ngay, không query DB', async () => {
    const result = await searchStudents('');
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('U2.3 - query undefined → trả về [] ngay, không query DB', async () => {
    const result = await searchStudents(undefined);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('U2.4 - tìm theo MSSV: .or() được gọi với pattern ilike', async () => {
    const mockChain = chain({ data: [], error: null });
    supabase.from.mockReturnValue(mockChain);

    await searchStudents('22521001');

    expect(supabase.from).toHaveBeenCalledWith('tai_khoan');
    expect(mockChain.or).toHaveBeenCalledWith(
      expect.stringContaining('mssv.ilike.%22521001%')
    );
    expect(mockChain.or).toHaveBeenCalledWith(
      expect.stringContaining('ho_ten.ilike.%22521001%')
    );
  });

  test('U2.5 - kết quả trả về đúng shape fields', async () => {
    const rawData = [
      { ma_tai_khoan: 1, mssv: '22521001', ho_ten: 'Nguyễn An', email: 'a@test.com', khoa: 'CNTT', loai_tai_khoan: 'SinhVien' },
    ];
    supabase.from.mockReturnValue(chain({ data: rawData, error: null }));

    const result = await searchStudents('22521');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ma_tai_khoan: 1,
      mssv: '22521001',
      ho_ten: 'Nguyễn An',
      email: 'a@test.com',
      khoa: 'CNTT',
    });
  });

  test('U2.6 - DB trả error → ném lỗi', async () => {
    supabase.from.mockReturnValue(chain(DB_ERROR));
    await expect(searchStudents('22521')).rejects.toThrow('DB connection failed');
  });

  test('U2.7 - limit(10) được gọi để giới hạn kết quả', async () => {
    const mockChain = chain({ data: [], error: null });
    supabase.from.mockReturnValue(mockChain);

    await searchStudents('nguyen');

    expect(mockChain.limit).toHaveBeenCalledWith(10);
  });
});

// ─── _verifyEventOwnership ────────────────────────────────────────────────────

describe('_verifyEventOwnership', () => {
  beforeEach(() => jest.clearAllMocks());

  test('U2.8 - sự kiện không tồn tại → ném EVENT_NOT_FOUND', async () => {
    supabase.from.mockReturnValue(chain(NOT_FOUND));
    await expect(_verifyEventOwnership(999, 5)).rejects.toMatchObject({ code: 'EVENT_NOT_FOUND' });
  });

  test('U2.9 - actorId không phải chủ sự kiện → ném FORBIDDEN', async () => {
    supabase.from.mockReturnValue(chain({ data: { ma_su_kien: 1, ma_tai_khoan_to_chuc: 5 }, error: null }));
    await expect(_verifyEventOwnership(1, 99)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('U2.10 - actorId đúng chủ → resolve, không ném lỗi', async () => {
    supabase.from.mockReturnValue(chain(OK_EVENT));
    await expect(_verifyEventOwnership(1, 5)).resolves.toBeDefined();
  });
});

// ─── getStaffByEvent ──────────────────────────────────────────────────────────

describe('getStaffByEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('U2.11 - ownership fail → ném FORBIDDEN', async () => {
    // event belongs to actor=5, but actorId=99
    supabase.from.mockReturnValue(chain(OK_EVENT));
    await expect(getStaffByEvent(1, 99)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('U2.12 - ownership ok, danh sách rỗng → trả về []', async () => {
    mockSequence(OK_EVENT, { data: [], error: null });
    const result = await getStaffByEvent(1, 5);
    expect(result).toEqual([]);
  });

  test('U2.13 - ownership ok, có staff → trả về array đã flatten', async () => {
    const staffData = [
      {
        ma_nhan_vien: 1,
        thoi_gian_tao: '2024-01-01',
        tai_khoan: { ma_tai_khoan: 10, mssv: '22521001', ho_ten: 'Test', email: 'a@b.com', khoa: 'CNTT', loai_tai_khoan: 'SinhVien' },
      },
    ];
    mockSequence(OK_EVENT, { data: staffData, error: null });
    const result = await getStaffByEvent(1, 5);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ma_nhan_vien: 1,
      mssv: '22521001',
      ho_ten: 'Test',
    });
    // Phải không còn nested tai_khoan object
    expect(result[0]).not.toHaveProperty('tai_khoan');
  });
});

// ─── assignStaff ─────────────────────────────────────────────────────────────

describe('assignStaff', () => {
  beforeEach(() => jest.clearAllMocks());

  test('U2.14 - ownership fail → ném FORBIDDEN trước khi check account', async () => {
    supabase.from.mockReturnValue(chain(OK_EVENT));
    await expect(assignStaff(1, 10, 99)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    // Chỉ gọi 1 lần (event check), không tiếp tục
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  test('U2.15 - tài khoản không tồn tại → ném STUDENT_NOT_FOUND', async () => {
    mockSequence(OK_EVENT, NOT_FOUND);
    await expect(assignStaff(1, 9999, 5)).rejects.toMatchObject({ code: 'STUDENT_NOT_FOUND' });
  });

  test('U2.16 - tài khoản bị khóa → ném ACCOUNT_LOCKED', async () => {
    const lockedAccount = {
      data: { ma_tai_khoan: 10, ho_ten: 'Locked User', mssv: '22521001', trang_thai_tai_khoan: 'Khoa' },
      error: null,
    };
    mockSequence(OK_EVENT, lockedAccount);
    await expect(assignStaff(1, 10, 5)).rejects.toMatchObject({ code: 'ACCOUNT_LOCKED' });
  });

  test('U2.17 - đã được gán (da_xoa=false) → ném ALREADY_ASSIGNED', async () => {
    const existingRecord = { data: { ma_nhan_vien: 5 }, error: null };
    mockSequence(OK_EVENT, OK_ACCOUNT, existingRecord);
    await expect(assignStaff(1, 10, 5)).rejects.toMatchObject({ code: 'ALREADY_ASSIGNED' });
  });

  test('U2.18 - thêm thành công → trả về object flatten đúng shape', async () => {
    mockSequence(OK_EVENT, OK_ACCOUNT, NOT_FOUND, OK_STAFF_ROW);
    const result = await assignStaff(1, 10, 5);

    expect(result).toMatchObject({
      ma_nhan_vien: 1,
      mssv: '22521001',
      ho_ten: 'Nguyễn Test',
    });
    expect(result).not.toHaveProperty('tai_khoan');
  });

  test('U2.19 - partial unique index chặn hai request đua nhau → ALREADY_ASSIGNED', async () => {
    const uniqueViolation = { data: null, error: { code: '23505', message: 'duplicate key' } };
    mockSequence(OK_EVENT, OK_ACCOUNT, NOT_FOUND, uniqueViolation);

    await expect(assignStaff(1, 10, 5)).rejects.toMatchObject({ code: 'ALREADY_ASSIGNED' });
  });

  test('U2.20 - sau revoke (da_xoa=true trước), gán lại thành công', async () => {
    // Giả lập: existing record bị da_xoa=true → maybeSingle trả null (do query .eq('da_xoa',false))
    mockSequence(OK_EVENT, OK_ACCOUNT, NOT_FOUND, OK_STAFF_ROW);
    const result = await assignStaff(1, 10, 5);
    expect(result.ma_nhan_vien).toBe(1);
  });
});

// ─── revokeStaff ─────────────────────────────────────────────────────────────

describe('revokeStaff', () => {
  beforeEach(() => jest.clearAllMocks());

  test('U2.20 - ownership fail → ném FORBIDDEN', async () => {
    supabase.from.mockReturnValue(chain(OK_EVENT));
    await expect(revokeStaff(1, 1, 99)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('U2.21 - staffId không thuộc sự kiện hoặc đã revoked → ném STAFF_NOT_FOUND', async () => {
    mockSequence(OK_EVENT, NOT_FOUND);
    await expect(revokeStaff(1, 999, 5)).rejects.toMatchObject({ code: 'STAFF_NOT_FOUND' });
  });

  test('U2.22 - revoke thành công → trả { revoked: true, ma_nhan_vien }', async () => {
    const staffRecord = { data: { ma_nhan_vien: 1, ma_su_kien: 1, da_xoa: false }, error: null };
    const updateResult = { data: { ma_nhan_vien: 1 }, error: null };
    mockSequence(OK_EVENT, staffRecord, updateResult);
    const result = await revokeStaff(1, 1, 5);

    expect(result).toEqual({ revoked: true, ma_nhan_vien: 1 });
  });

  test('U2.23 - record biến mất trước update → STAFF_NOT_FOUND', async () => {
    const staffRecord = { data: { ma_nhan_vien: 1, ma_su_kien: 1, da_xoa: false }, error: null };
    mockSequence(OK_EVENT, staffRecord, NOT_FOUND);

    await expect(revokeStaff(1, 1, 5)).rejects.toMatchObject({ code: 'STAFF_NOT_FOUND' });
  });

  test('U2.24 - DB error trong update → ném lỗi', async () => {
    const staffRecord = { data: { ma_nhan_vien: 1, ma_su_kien: 1, da_xoa: false }, error: null };
    mockSequence(OK_EVENT, staffRecord, DB_ERROR);
    await expect(revokeStaff(1, 1, 5)).rejects.toThrow('DB connection failed');
  });
});
