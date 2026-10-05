const checkinService = require("../../src/services/checkin.service");
const supabase = require("../../src/config/supabase");

jest.mock("../../src/config/supabase", () => ({
  from: jest.fn(),
}));

function makeChain(resolved) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(resolved),
  };
}

describe("checkin.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAssignedEvents", () => {
    const now = new Date("2026-10-05T03:30:00.000Z"); // 10:30 Asia/Ho_Chi_Minh

    it("returns staff assigned events, removes drafts/deleted/duplicates, and marks scan window", async () => {
      supabase.from.mockReturnValue(
        makeChain({
          data: [
            {
              ma_nhan_vien: 1,
              su_kien: {
                ma_su_kien: 10,
                ten_su_kien: "Dang mo",
                dia_diem: "Hall",
                phong: "A1",
                ngay_dien_ra: "2026-10-05",
                thoi_gian_bat_dau: "10:00:00",
                thoi_gian_ket_thuc: "11:00:00",
                trang_thai_su_kien: "DangDienRa",
                da_xoa: false,
              },
            },
            {
              ma_nhan_vien: 2,
              su_kien: {
                ma_su_kien: 10,
                ten_su_kien: "Dang mo",
                dia_diem: "Hall",
                phong: "A1",
                ngay_dien_ra: "2026-10-05",
                thoi_gian_bat_dau: "10:00:00",
                thoi_gian_ket_thuc: "11:00:00",
                trang_thai_su_kien: "DangDienRa",
                da_xoa: false,
              },
            },
            {
              ma_nhan_vien: 3,
              su_kien: {
                ma_su_kien: 11,
                ten_su_kien: "Ban nhap",
                ngay_dien_ra: "2026-10-05",
                thoi_gian_bat_dau: "12:00:00",
                thoi_gian_ket_thuc: "13:00:00",
                trang_thai_su_kien: "BanNhap",
                da_xoa: false,
              },
            },
            {
              ma_nhan_vien: 4,
              su_kien: {
                ma_su_kien: 12,
                ten_su_kien: "Da xoa",
                ngay_dien_ra: "2026-10-05",
                thoi_gian_bat_dau: "09:00:00",
                thoi_gian_ket_thuc: "10:00:00",
                trang_thai_su_kien: "SapToChuc",
                da_xoa: true,
              },
            },
          ],
          error: null,
        })
      );

      const result = await checkinService.getAssignedEvents(
        { id: 7, role: "NhanVienCheckIn" },
        { now }
      );

      expect(supabase.from).toHaveBeenCalledWith("nhan_vien_check_in");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ma_su_kien: 10,
        ten_su_kien: "Dang mo",
        checkInWindowOpen: true,
        canScan: true,
      });
    });

    it("returns organizer-owned non-draft events sorted by start time", async () => {
      supabase.from.mockReturnValue(
        makeChain({
          data: [
            {
              ma_su_kien: 2,
              ten_su_kien: "Later",
              dia_diem: "B",
              phong: null,
              ngay_dien_ra: "2026-10-06",
              thoi_gian_bat_dau: "09:00:00",
              thoi_gian_ket_thuc: "10:00:00",
              trang_thai_su_kien: "SapToChuc",
              da_xoa: false,
            },
            {
              ma_su_kien: 1,
              ten_su_kien: "Sooner",
              dia_diem: "A",
              phong: null,
              ngay_dien_ra: "2026-10-05",
              thoi_gian_bat_dau: "09:00:00",
              thoi_gian_ket_thuc: "10:00:00",
              trang_thai_su_kien: "SapToChuc",
              da_xoa: false,
            },
          ],
          error: null,
        })
      );

      const result = await checkinService.getAssignedEvents(
        { id: 5, role: "ToChuc" },
        { now }
      );

      expect(supabase.from).toHaveBeenCalledWith("su_kien");
      expect(result.map((event) => event.ma_su_kien)).toEqual([1, 2]);
      expect(result[0].canScan).toBe(false);
    });

    it("rejects unsupported roles", async () => {
      await expect(
        checkinService.getAssignedEvents({ id: 1, role: "SinhVien" })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("scanTicket", () => {
    it("calls check_in_ticket RPC with actor id, event id, and trimmed QR", async () => {
      supabase.rpc = jest.fn().mockResolvedValue({
        data: {
          success: true,
          code: "CHECK_IN_SUCCESS",
          ma_dang_ky: 33,
          ma_su_kien: 10,
          checkedInAt: "2026-10-05T03:30:00.000Z",
          student: {
            ma_tai_khoan: 8,
            mssv: "22521001",
            ho_ten: "Test Student",
            khoa: "CNTT",
          },
        },
        error: null,
      });

      const result = await checkinService.scanTicket({
        actorId: 7,
        eventId: "10",
        qrCode: "  QR-OPAQUE  ",
      });

      expect(supabase.rpc).toHaveBeenCalledWith("check_in_ticket", {
        p_actor_id: 7,
        p_ma_su_kien: 10,
        p_ma_qr_code: "QR-OPAQUE",
      });
      expect(result).toMatchObject({
        code: "CHECK_IN_SUCCESS",
        ma_dang_ky: 33,
        ma_su_kien: 10,
      });
    });

    it("rejects invalid scan input before calling RPC", async () => {
      supabase.rpc = jest.fn();

      await expect(
        checkinService.scanTicket({
          actorId: 7,
          eventId: "abc",
          qrCode: "QR",
        })
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });

      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it("throws coded errors returned by RPC and keeps payload for UI", async () => {
      supabase.rpc = jest.fn().mockResolvedValue({
        data: {
          success: false,
          code: "ALREADY_CHECKED_IN",
          ma_dang_ky: 33,
          checkedInAt: "2026-10-05T03:30:00.000Z",
        },
        error: null,
      });

      await expect(
        checkinService.scanTicket({
          actorId: 7,
          eventId: 10,
          qrCode: "QR-OPAQUE",
        })
      ).rejects.toMatchObject({
        code: "ALREADY_CHECKED_IN",
        payload: {
          ma_dang_ky: 33,
        },
      });
    });
  });

  describe("getHistory", () => {
    it("returns checked-in history when actor has access to the event", async () => {
      const assignedEventsChain = makeChain({
        data: [
          {
            ma_su_kien: 10,
            ten_su_kien: "Owned Event",
            dia_diem: "Hall",
            phong: "A1",
            ngay_dien_ra: "2026-10-05",
            thoi_gian_bat_dau: "09:00:00",
            thoi_gian_ket_thuc: "10:00:00",
            trang_thai_su_kien: "DaKetThuc",
            da_xoa: false,
          },
        ],
        error: null,
      });
      const historyChain = makeChain({
        data: [
          {
            ma_dang_ky: 20,
            thoi_gian_check_in: "2026-10-05T03:30:00",
            tai_khoan: {
              ma_tai_khoan: 8,
              mssv: "22521001",
              ho_ten: "Test Student",
              khoa: "CNTT",
            },
          },
        ],
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(assignedEventsChain)
        .mockReturnValueOnce(historyChain);

      const result = await checkinService.getHistory({
        actorId: 5,
        role: "ToChuc",
        eventId: 10,
      });

      expect(result).toEqual({
        items: [
          {
            ma_dang_ky: 20,
            student: {
              ma_tai_khoan: 8,
              mssv: "22521001",
              ho_ten: "Test Student",
              khoa: "CNTT",
            },
            checkedInAt: "2026-10-05T03:30:00",
          },
        ],
        nextCursor: null,
      });
    });
  });
});
