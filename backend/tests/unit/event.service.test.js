/**
 * Unit Tests cho Event Service & Event Status Utility (Gói 2)
 */

const eventService = require('../../src/services/event.service');
const { computeEventStatus, processEventWithStatus } = require('../../src/utils/eventStatus');
const supabase = require('../../src/config/supabase');

// Mock dependencies
jest.mock('../../src/config/supabase', () => ({
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
}));

describe('Unit Tests - Event Management (Gói 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. TEST UTILITY: computeEventStatus ─────────────────────────────────────
  describe('Utility: computeEventStatus', () => {
    it('1.1 - Giữ nguyên trạng thái BanNhap', () => {
      const event = { trang_thai_su_kien: 'BanNhap', ngay_dien_ra: '2020-01-01', thoi_gian_bat_dau: '08:00', thoi_gian_ket_thuc: '10:00' };
      expect(computeEventStatus(event)).toBe('BanNhap');
    });

    it('1.2 - Giữ nguyên trạng thái DaKetThuc (khi được bấm hủy/kết thúc thủ công)', () => {
      const event = { trang_thai_su_kien: 'DaKetThuc', ngay_dien_ra: '2030-01-01', thoi_gian_bat_dau: '08:00', thoi_gian_ket_thuc: '10:00' };
      expect(computeEventStatus(event)).toBe('DaKetThuc');
    });

    it('1.3 - Tính toán trạng thái SapToChuc cho sự kiện trong tương lai', () => {
      const futureDate = '2035-12-25';
      const event = { trang_thai_su_kien: 'SapToChuc', ngay_dien_ra: futureDate, thoi_gian_bat_dau: '08:00', thoi_gian_ket_thuc: '10:00' };
      expect(computeEventStatus(event)).toBe('SapToChuc');
    });

    it('1.4 - Tính toán trạng thái DangDienRa cho sự kiện trong khung giờ hiện tại (múi giờ GMT+7)', () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateIso = `${yyyy}-${mm}-${dd}`;

      // Bắt đầu 15 phút trước, kết thúc 30 phút sau
      const startTime = new Date(now.getTime() - 15 * 60 * 1000);
      const endTime = new Date(now.getTime() + 30 * 60 * 1000);

      const startStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      const endStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

      const ongoingEvent = {
        trang_thai_su_kien: 'SapToChuc',
        ngay_dien_ra: dateIso,
        thoi_gian_bat_dau: startStr,
        thoi_gian_ket_thuc: endStr,
      };

      expect(computeEventStatus(ongoingEvent)).toBe('DangDienRa');
    });

    it('1.5 - Chuẩn hóa định dạng ngày DD/MM/YYYY cho sự kiện đang diễn ra', () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateSlash = `${dd}/${mm}/${yyyy}`; // DD/MM/YYYY

      const startTime = new Date(now.getTime() - 10 * 60 * 1000);
      const endTime = new Date(now.getTime() + 20 * 60 * 1000);

      const startStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      const endStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

      const ongoingEvent = {
        trang_thai_su_kien: 'SapToChuc',
        ngay_dien_ra: dateSlash,
        thoi_gian_bat_dau: startStr,
        thoi_gian_ket_thuc: endStr,
      };

      expect(computeEventStatus(ongoingEvent)).toBe('DangDienRa');
    });

    it('1.6 - Tính toán trạng thái DaKetThuc cho sự kiện đã qua thời gian kết thúc', () => {
      const pastEvent = {
        trang_thai_su_kien: 'SapToChuc',
        ngay_dien_ra: '2020-01-01',
        thoi_gian_bat_dau: '08:00',
        thoi_gian_ket_thuc: '10:00',
      };
      expect(computeEventStatus(pastEvent)).toBe('DaKetThuc');
    });

    it('1.7 - Fallback về trạng thái cũ nếu ngày giờ không hợp lệ', () => {
      const invalidEvent = {
        trang_thai_su_kien: 'SapToChuc',
        ngay_dien_ra: 'invalid-date',
        thoi_gian_bat_dau: 'invalid-time',
        thoi_gian_ket_thuc: 'invalid-time',
      };
      expect(computeEventStatus(invalidEvent)).toBe('SapToChuc');
    });
  });

  // ─── 2. TEST UTILITY: processEventWithStatus ───────────────────────────────
  describe('Utility: processEventWithStatus', () => {
    it('2.1 - Gán trạng thái đã tính toán và kích hoạt update ngầm khi trạng thái thay đổi', () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue(Promise.resolve());
      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const pastEvent = {
        ma_su_kien: 123,
        trang_thai_su_kien: 'SapToChuc',
        ngay_dien_ra: '2020-01-01',
        thoi_gian_bat_dau: '08:00',
        thoi_gian_ket_thuc: '10:00',
      };

      const result = processEventWithStatus(pastEvent);

      expect(result.trang_thai_su_kien).toBe('DaKetThuc');
      expect(supabase.from).toHaveBeenCalledWith('su_kien');
      expect(mockUpdate).toHaveBeenCalledWith({ trang_thai_su_kien: 'DaKetThuc' });
    });
  });

  // ─── 3. TEST SERVICE: uploadEventBannerService ─────────────────────────────
  describe('Service: uploadEventBannerService', () => {
    it('3.1 - Upload ảnh bìa lên Supabase Storage thành công và lấy Public URL', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'banner.png' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.co/storage/banner.png' } });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const url = await eventService.uploadEventBannerService(base64Data, 'test.png', 'image/png');

      expect(url).toBe('https://supabase.co/storage/banner.png');
      expect(supabase.storage.from).toHaveBeenCalledWith('event-banners');
    });

    it('3.2 - Fallback về Base64 Data URL nếu Supabase Storage gặp lỗi', async () => {
      supabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'Bucket not found' } }),
        getPublicUrl: jest.fn(),
      });

      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const url = await eventService.uploadEventBannerService(base64Data, 'test.png', 'image/png');

      expect(url).toBe(base64Data);
    });

    it('3.3 - Fallback về ảnh placeholder mặc định nếu dữ liệu không phải base64 và Storage lỗi', async () => {
      supabase.storage.from.mockImplementation(() => {
        throw new Error('Storage Error');
      });

      const url = await eventService.uploadEventBannerService('invalid-data', 'test.png', 'image/png');
      expect(url).toBe('https://placehold.co/1200x630/png?text=Campus+Event');
    });
  });

  // ─── 4. TEST SERVICE: createEventService ────────────────────────────────────
  describe('Service: createEventService', () => {
    it('4.1 - Tạo sự kiện mới với ảnh bìa tùy chỉnh thành công', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { ma_su_kien: 1, ten_su_kien: 'Event A' }, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      supabase.from.mockReturnValue({ insert: mockInsert });

      const eventData = {
        ten_su_kien: 'Event A',
        anh_bia: 'https://example.com/custom.png',
      };

      const result = await eventService.createEventService(eventData, 1);

      expect(result).toEqual({ ma_su_kien: 1, ten_su_kien: 'Event A' });
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          ten_su_kien: 'Event A',
          anh_bia: 'https://example.com/custom.png',
          ma_tai_khoan_to_chuc: 1,
        }),
      ]);
    });

    it('4.2 - Tạo sự kiện tự động gán ảnh bìa mặc định khi không truyền anh_bia', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { ma_su_kien: 2, ten_su_kien: 'Event B' }, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

      supabase.from.mockReturnValue({ insert: mockInsert });

      const eventData = { ten_su_kien: 'Event B' };
      await eventService.createEventService(eventData, 1);

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          anh_bia: 'https://placehold.co/1200x630/png?text=Campus+Event',
        }),
      ]);
    });
  });

  // ─── 5. TEST SERVICE: updateEventService ────────────────────────────────────
  describe('Service: updateEventService', () => {
    it('5.1 - Cập nhật sự kiện thành công khi sức chứa hợp lệ', async () => {
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockEqCount = jest.fn().mockReturnThis();
      const mockNeqCount = jest.fn().mockResolvedValue({ count: 10, error: null });

      const mockSingle = jest.fn().mockResolvedValue({ data: { ma_su_kien: 1, so_luong_toi_da: 50 }, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq2 = jest.fn().mockReturnValue({ select: mockSelect });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq1 });

      supabase.from.mockImplementation((table) => {
        if (table === 'dang_ky') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockResolvedValue({ count: 10, error: null }),
              }),
            }),
          };
        }
        if (table === 'su_kien') {
          return { update: mockUpdate };
        }
      });

      const updateData = { so_luong_toi_da: 50 };
      const result = await eventService.updateEventService(1, updateData, 1);

      expect(result).toEqual({ ma_su_kien: 1, so_luong_toi_da: 50 });
    });

    it('5.2 - Ném lỗi khi cập nhật sức chứa nhỏ hơn số lượng vé đã đăng ký', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'dang_ky') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockResolvedValue({ count: 50, error: null }),
              }),
            }),
          };
        }
      });

      const updateData = { so_luong_toi_da: 20 }; // Nhỏ hơn 50 vé đã đặt

      await expect(eventService.updateEventService(1, updateData, 1)).rejects.toThrow(
        'Không thể giảm sức chứa xuống dưới số vé đã đăng ký (50 vé)'
      );
    });
  });
});
