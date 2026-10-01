/**
 * Unit tests cho participants.service.js
 *
 * Strategy: Mock supabase client để test logic service mà không cần DB thật.
 * Chỉ test business logic, không test Supabase SDK internals.
 */

// Mock module supabase trước khi require service
jest.mock('../../src/config/supabase.js', () => {
  const mockFrom = jest.fn();
  return { from: mockFrom };
});

const supabase = require('../../src/config/supabase.js');
const { getParticipants, changeTicketStatus } = require('../../src/services/participants.service.js');

// Helper để build mock Supabase chain
function buildChain(returnValue) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(returnValue),
    single: jest.fn().mockResolvedValue(returnValue),
  };
  // range returns the resolved value (end of chain for data queries)
  chain.range = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

// Dữ liệu mẫu
const sampleParticipants = [
  {
    ma_dang_ky: 1,
    ma_qr_code: 'uuid-1',
    trang_thai_ve: 'DaDangKy',
    thoi_gian_tao: '2024-01-01T00:00:00',
    thoi_gian_check_in: null,
    thoi_gian_huy: null,
    ghi_chu: null,
    tai_khoan: { ma_tai_khoan: 10, mssv: '22521001', ho_ten: 'Nguyễn Văn An', email: 'a@gm.uit.edu.vn', khoa: 'CNTT' },
  },
  {
    ma_dang_ky: 2,
    ma_qr_code: 'uuid-2',
    trang_thai_ve: 'DaCheckIn',
    thoi_gian_tao: '2024-01-02T00:00:00',
    thoi_gian_check_in: '2024-01-10T08:00:00',
    thoi_gian_huy: null,
    ghi_chu: null,
    tai_khoan: { ma_tai_khoan: 11, mssv: '22521002', ho_ten: 'Trần Thị Bích', email: 'b@gm.uit.edu.vn', khoa: 'ATTT' },
  },
];

describe('participants.service - getParticipants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('U1.1 - Trả về array participants với đủ fields khi không có filter', async () => {
    const mockChain = buildChain({ data: sampleParticipants, error: null, count: 2 });
    supabase.from.mockReturnValue(mockChain);

    const result = await getParticipants(1);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data[0]).toHaveProperty('mssv');
    expect(result.data[0]).toHaveProperty('ho_ten');
    expect(result.data[0]).toHaveProperty('trang_thai_ve');
    expect(result.data[0]).toHaveProperty('ma_dang_ky');
  });

  test('U1.2 - Filter theo status=DaCheckIn truyền đúng vào query', async () => {
    const checkedIn = [sampleParticipants[1]]; // chỉ item thứ 2 có DaCheckIn
    const mockChain = buildChain({ data: checkedIn, error: null, count: 1 });
    supabase.from.mockReturnValue(mockChain);

    const result = await getParticipants(1, { status: 'DaCheckIn' });

    expect(mockChain.eq).toHaveBeenCalledWith('trang_thai_ve', 'DaCheckIn');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].trang_thai_ve).toBe('DaCheckIn');
  });

  test('U1.3 - Filter theo search MSSV lọc đúng kết quả', async () => {
    const mockChain = buildChain({ data: sampleParticipants, error: null, count: 2 });
    supabase.from.mockReturnValue(mockChain);

    const result = await getParticipants(1, { search: '22521001' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].mssv).toBe('22521001');
  });

  test('U1.4 - Phân trang: page=2, limit=5 → offset=5', async () => {
    const mockChain = buildChain({ data: [], error: null, count: 0 });
    supabase.from.mockReturnValue(mockChain);

    await getParticipants(1, { page: 2, limit: 5 });

    // range(5, 9) → offset=5, offset+limit-1=9
    expect(mockChain.range).toHaveBeenCalledWith(5, 9);
  });

  test('U1.5 - Ném lỗi khi Supabase trả error', async () => {
    const mockChain = buildChain({ data: null, error: new Error('DB Error'), count: 0 });
    supabase.from.mockReturnValue(mockChain);

    await expect(getParticipants(1)).rejects.toThrow('DB Error');
  });
});

describe('participants.service - changeTicketStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('U1.6 - Đổi sang DaCheckIn: ghi thoi_gian_check_in', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Fetch ticket
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { ma_dang_ky: 1, trang_thai_ve: 'DaDangKy', ma_su_kien: 1, da_xoa: false },
            error: null,
          }),
        };
      }
      if (callCount === 2) {
        // Fetch event (ownership check)
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { ma_tai_khoan_to_chuc: 5 },
            error: null,
          }),
        };
      }
      // Update
      return {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ma_dang_ky: 1, trang_thai_ve: 'DaCheckIn', thoi_gian_check_in: '2024-01-10T08:00:00' },
          error: null,
        }),
      };
    });

    const result = await changeTicketStatus(1, 'DaCheckIn', 5);
    expect(result.trang_thai_ve).toBe('DaCheckIn');
    expect(result).toHaveProperty('thoi_gian_check_in');
  });

  test('U1.7 - Ném TICKET_NOT_FOUND khi ticket không tồn tại', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(changeTicketStatus(9999, 'DaCheckIn', 5)).rejects.toMatchObject({
      code: 'TICKET_NOT_FOUND',
    });
  });

  test('U1.8 - Ném INVALID_STATUS khi status không hợp lệ', async () => {
    await expect(changeTicketStatus(1, 'TrangThaiLa', 5)).rejects.toMatchObject({
      code: 'INVALID_STATUS',
    });
  });

  test('U1.9 - Ném FORBIDDEN khi actorId không phải chủ sự kiện', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { ma_dang_ky: 1, trang_thai_ve: 'DaDangKy', ma_su_kien: 1, da_xoa: false },
            error: null,
          }),
        };
      }
      // actorId=99 không khớp với ma_tai_khoan_to_chuc=5
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { ma_tai_khoan_to_chuc: 5 },
          error: null,
        }),
      };
    });

    await expect(changeTicketStatus(1, 'DaCheckIn', 99)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
