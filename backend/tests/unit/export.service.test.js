/**
 * Unit Tests cho export.service.js (Phase 3 - Gói 7)
 *
 * Coverage targets:
 *   - _verifyEventOwnership: not found, forbidden, success, DB error
 *   - formatDateTime & escapeCSV: formatting & RFC 4180 escaping
 *   - getParticipantsForExport: data mapping, empty list, DB error
 *   - exportParticipantsCSV: UTF-8 BOM, headers, row count, escaping, filename
 *   - exportParticipantsXLSX: magic bytes, ExcelJS parse, sheet name, column headers, row count, styling
 *
 * Tổng: 25 test cases
 */

jest.mock('../../src/config/supabase.js', () => ({ from: jest.fn() }));

const ExcelJS = require('exceljs');
const supabase = require('../../src/config/supabase.js');
const {
  exportParticipantsCSV,
  exportParticipantsXLSX,
  getParticipantsForExport,
  _verifyEventOwnership,
  STATUS_TEXT_MAP,
  escapeCSV,
  formatDateTime,
} = require('../../src/services/export.service.js');

// ─── MOCK BUILDER ─────────────────────────────────────────────────────────────

const chain = (resolved) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockResolvedValue(resolved),
  maybeSingle: jest.fn().mockResolvedValue(resolved),
  single: jest.fn().mockResolvedValue(resolved),
});

/** Mock Supabase queries by table name */
function mockByTable({ suKien = null, dangKy = null } = {}) {
  supabase.from.mockImplementation((table) => {
    if (table === 'su_kien') return chain(suKien);
    if (table === 'dang_ky') return chain(dangKy);
    return chain({ data: null, error: null });
  });
}

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

const EVENT_ID = 1;
const ACTOR_ID = 5;
const OTHER_ACTOR_ID = 99;

const SAMPLE_EVENT = {
  ma_su_kien: EVENT_ID,
  ten_su_kien: 'Hội thảo AI & Robotics 2026',
  ma_tai_khoan_to_chuc: ACTOR_ID,
};

const SAMPLE_PARTICIPANTS = [
  {
    ma_dang_ky: 101,
    ma_qr_code: 'uuid-qr-1',
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
    ma_qr_code: 'uuid-qr-2',
    trang_thai_ve: 'DaCheckIn',
    thoi_gian_tao: '2026-03-01T09:00:00.000Z',
    thoi_gian_check_in: '2026-03-05T07:45:00.000Z',
    thoi_gian_huy: null,
    ghi_chu: null,
    tai_khoan: {
      ma_tai_khoan: 11,
      mssv: '22521002',
      ho_ten: 'Trần Thị "Bích", Mai', // Tên chứa cả ngoặc kép và dấu phẩy để test CSV escape
      email: 'bich@gm.uit.edu.vn',
      khoa: 'Mạng máy tính & TT',
    },
  },
  {
    ma_dang_ky: 103,
    ma_qr_code: 'uuid-qr-3',
    trang_thai_ve: 'DaHuy',
    thoi_gian_tao: '2026-03-01T10:15:00.000Z',
    thoi_gian_check_in: null,
    thoi_gian_huy: '2026-03-02T14:00:00.000Z',
    ghi_chu: null,
    tai_khoan: {
      ma_tai_khoan: 12,
      mssv: '22521003',
      ho_ten: 'Lê Hoàng Cường',
      email: 'cuong@gm.uit.edu.vn',
      khoa: 'Kỹ thuật Phần mềm',
    },
  },
];

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('export.service.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. _verifyEventOwnership
  // =========================================================================
  describe('_verifyEventOwnership', () => {
    test('U3.1 - Event không tồn tại → ném EVENT_NOT_FOUND', async () => {
      mockByTable({ suKien: { data: null, error: null } });

      await expect(_verifyEventOwnership(999, ACTOR_ID)).rejects.toMatchObject({
        code: 'EVENT_NOT_FOUND',
      });
    });

    test('U3.2 - ActorId không phải chủ sự kiện → ném FORBIDDEN', async () => {
      mockByTable({ suKien: { data: SAMPLE_EVENT, error: null } });

      await expect(_verifyEventOwnership(EVENT_ID, OTHER_ACTOR_ID)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    test('U3.3 - ActorId đúng chủ → resolve event object', async () => {
      mockByTable({ suKien: { data: SAMPLE_EVENT, error: null } });

      const result = await _verifyEventOwnership(EVENT_ID, ACTOR_ID);
      expect(result.ma_su_kien).toBe(EVENT_ID);
      expect(result.ten_su_kien).toBe(SAMPLE_EVENT.ten_su_kien);
    });

    test('U3.4 - DB trả error → ném error nguyên bản', async () => {
      mockByTable({ suKien: { data: null, error: new Error('Database connection failed') } });

      await expect(_verifyEventOwnership(EVENT_ID, ACTOR_ID)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  // =========================================================================
  // 2. formatDateTime & escapeCSV helpers
  // =========================================================================
  describe('formatDateTime & escapeCSV', () => {
    test('U3.5 - formatDateTime định dạng ISO string thành YYYY-MM-DD HH:mm:ss', () => {
      const formatted = formatDateTime('2026-03-01T08:30:00.000Z');
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('U3.6 - formatDateTime trả về chuỗi rỗng khi input null hoặc undefined', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
      expect(formatDateTime('')).toBe('');
    });

    test('U3.7 - escapeCSV bọc ngoặc kép khi chuỗi chứa dấu phẩy', () => {
      expect(escapeCSV('Nguyễn, An')).toBe('"Nguyễn, An"');
    });

    test('U3.8 - escapeCSV nhân đôi dấu ngoặc kép khi chuỗi chứa "', () => {
      expect(escapeCSV('Hội thảo "AI"')).toBe('"Hội thảo ""AI"""');
    });

    test('U3.9 - escapeCSV bọc ngoặc kép khi chuỗi chứa ký tự xuống dòng', () => {
      expect(escapeCSV("Dòng 1\nDòng 2")).toBe("\"Dòng 1\nDòng 2\"");
    });

    test('U3.10 - escapeCSV giữ nguyên khi chuỗi không chứa ký tự đặc biệt', () => {
      expect(escapeCSV('22521001')).toBe('22521001');
      expect(escapeCSV('Nguyễn Văn An')).toBe('Nguyễn Văn An');
    });
  });

  // =========================================================================
  // 3. getParticipantsForExport
  // =========================================================================
  describe('getParticipantsForExport', () => {
    test('U3.11 - Map đầy đủ dữ liệu người tham gia và text trạng thái tiếng Việt', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { event, participants } = await getParticipantsForExport(EVENT_ID, ACTOR_ID);

      expect(event.ten_su_kien).toBe(SAMPLE_EVENT.ten_su_kien);
      expect(participants).toHaveLength(3);

      expect(participants[0]).toMatchObject({
        stt: 1,
        mssv: '22521001',
        ho_ten: 'Nguyễn Văn An',
        email: 'an@gm.uit.edu.vn',
        khoa: 'Khoa học Máy tính',
        trang_thai_ve: 'DaDangKy',
        trang_thai_text: 'Đã đăng ký',
      });

      expect(participants[1].trang_thai_text).toBe('Đã check-in');
      expect(participants[2].trang_thai_text).toBe('Đã hủy');
    });

    test('U3.12 - Sự kiện chưa có người đăng ký → trả về mảng rỗng', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: [], error: null },
      });

      const { participants } = await getParticipantsForExport(EVENT_ID, ACTOR_ID);
      expect(participants).toEqual([]);
    });

    test('U3.13 - DB error trong bảng dang_ky → ném error', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: null, error: new Error('Postgres error in dang_ky') },
      });

      await expect(getParticipantsForExport(EVENT_ID, ACTOR_ID)).rejects.toThrow(
        'Postgres error in dang_ky'
      );
    });
  });

  // =========================================================================
  // 4. exportParticipantsCSV
  // =========================================================================
  describe('exportParticipantsCSV', () => {
    test('U3.14 - Buffer bắt đầu bằng UTF-8 BOM (0xEF, 0xBB, 0xBF)', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsCSV(EVENT_ID, ACTOR_ID);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      // UTF-8 BOM bytes: 0xEF, 0xBB, 0xBF
      expect(buffer[0]).toBe(0xef);
      expect(buffer[1]).toBe(0xbb);
      expect(buffer[2]).toBe(0xbf);
    });

    test('U3.15 - Dòng đầu tiên là header với 8 cột chuẩn', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsCSV(EVENT_ID, ACTOR_ID);
      const content = buffer.toString('utf8');

      // Bỏ ký tự BOM ở đầu (\uFEFF)
      const cleanContent = content.replace(/^\uFEFF/, '');
      const firstLine = cleanContent.split('\r\n')[0];

      expect(firstLine).toBe(
        'STT,MSSV,Họ tên,Email,Khoa,Trạng thái vé,Thời gian đặt,Thời gian check-in'
      );
    });

    test('U3.16 - Số dòng CSV khớp chính xác số người tham gia + 1 dòng header', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer, total } = await exportParticipantsCSV(EVENT_ID, ACTOR_ID);
      const cleanContent = buffer.toString('utf8').replace(/^\uFEFF/, '');
      const lines = cleanContent.split('\r\n');

      expect(total).toBe(SAMPLE_PARTICIPANTS.length);
      expect(lines).toHaveLength(SAMPLE_PARTICIPANTS.length + 1);
    });

    test('U3.17 - Tên chứa dấu ngoặc kép và dấu phẩy được escape đúng chuẩn RFC 4180', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsCSV(EVENT_ID, ACTOR_ID);
      const cleanContent = buffer.toString('utf8').replace(/^\uFEFF/, '');

      // Check dòng chứa người thứ 2 (Trần Thị "Bích", Mai)
      expect(cleanContent).toContain('"Trần Thị ""Bích"", Mai"');
    });

    test('U3.18 - Filename có định dạng participants-event-{eventId}.csv', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { filename } = await exportParticipantsCSV(EVENT_ID, ACTOR_ID);
      expect(filename).toBe(`participants-event-${EVENT_ID}.csv`);
    });

    test('U3.19 - Khi không có người tham gia, chỉ có header row và BOM', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: [], error: null },
      });

      const { buffer, total } = await exportParticipantsCSV(EVENT_ID, ACTOR_ID);
      const cleanContent = buffer.toString('utf8').replace(/^\uFEFF/, '');
      const lines = cleanContent.split('\r\n');

      expect(total).toBe(0);
      expect(lines).toHaveLength(1); // Chỉ dòng header
    });
  });

  // =========================================================================
  // 5. exportParticipantsXLSX
  // =========================================================================
  describe('exportParticipantsXLSX', () => {
    test('U3.20 - Buffer trả về có magic bytes của file XLSX/ZIP (0x50, 0x4B, 0x03, 0x04)', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsXLSX(EVENT_ID, ACTOR_ID);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      // PK.. signature
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
      expect(buffer[2]).toBe(0x03);
      expect(buffer[3]).toBe(0x04);
    });

    test('U3.21 - Filename có định dạng participants-event-{eventId}.xlsx', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { filename } = await exportParticipantsXLSX(EVENT_ID, ACTOR_ID);
      expect(filename).toBe(`participants-event-${EVENT_ID}.xlsx`);
    });

    test('U3.22 - ExcelJS có thể nạp lại buffer và có worksheet "Danh sách tham gia"', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsXLSX(EVENT_ID, ACTOR_ID);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet('Danh sách tham gia');
      expect(worksheet).toBeDefined();
    });

    test('U3.23 - Worksheet có đủ 8 cột header chuẩn', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsXLSX(EVENT_ID, ACTOR_ID);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet('Danh sách tham gia');

      const expectedHeaders = [
        'STT',
        'MSSV',
        'Họ tên',
        'Email',
        'Khoa',
        'Trạng thái vé',
        'Thời gian đặt',
        'Thời gian check-in',
      ];

      const headerValues = [];
      worksheet.getRow(1).eachCell((cell) => {
        headerValues.push(cell.value);
      });

      expect(headerValues).toEqual(expectedHeaders);
    });

    test('U3.24 - Số hàng trong worksheet khớp chính xác số người tham gia + 1 hàng header', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsXLSX(EVENT_ID, ACTOR_ID);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet('Danh sách tham gia');

      expect(worksheet.rowCount).toBe(SAMPLE_PARTICIPANTS.length + 1);
    });

    test('U3.25 - Header row có kiểu dáng đậm và màu nền tím thương hiệu (Indigo)', async () => {
      mockByTable({
        suKien: { data: SAMPLE_EVENT, error: null },
        dangKy: { data: SAMPLE_PARTICIPANTS, error: null },
      });

      const { buffer } = await exportParticipantsXLSX(EVENT_ID, ACTOR_ID);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet('Danh sách tham gia');

      const firstHeaderCell = worksheet.getRow(1).getCell(1);
      expect(firstHeaderCell.font.bold).toBe(true);
      expect(firstHeaderCell.fill.fgColor.argb).toBe('FF4F46E5');
    });
  });
});
