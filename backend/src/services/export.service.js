const ExcelJS = require('exceljs');
const supabasePkg = require('../config/supabase.js');
const supabase = supabasePkg.supabase || supabasePkg;

const STATUS_TEXT_MAP = {
  DaDangKy: 'Đã đăng ký',
  DaCheckIn: 'Đã check-in',
  DaHuy: 'Đã hủy',
};

/**
 * Verify sự kiện tồn tại và thuộc về actorId (BTC)
 * @throws { code: 'EVENT_NOT_FOUND' | 'FORBIDDEN' }
 */
const _verifyEventOwnership = async (eventId, actorId) => {
  const { data: event, error } = await supabase
    .from('su_kien')
    .select('ma_su_kien, ten_su_kien, ma_tai_khoan_to_chuc')
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .maybeSingle();

  if (error) throw error;

  if (!event) {
    const err = new Error('Sự kiện không tồn tại hoặc đã bị xóa');
    err.code = 'EVENT_NOT_FOUND';
    throw err;
  }

  if (event.ma_tai_khoan_to_chuc !== actorId) {
    const err = new Error('Bạn không có quyền xuất dữ liệu sự kiện này');
    err.code = 'FORBIDDEN';
    throw err;
  }

  return event;
};

/**
 * Format datetime ISO sang chuỗi YYYY-MM-DD HH:mm:ss cho file xuất
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
};

/**
 * Escape chuỗi theo chuẩn RFC 4180 cho CSV
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Lấy danh sách toàn bộ người tham gia để export
 */
const getParticipantsForExport = async (eventId, actorId) => {
  const event = await _verifyEventOwnership(eventId, actorId);

  const { data, error } = await supabase
    .from('dang_ky')
    .select(
      `
      ma_dang_ky,
      ma_qr_code,
      trang_thai_ve,
      thoi_gian_tao,
      thoi_gian_check_in,
      thoi_gian_huy,
      ghi_chu,
      tai_khoan (
        ma_tai_khoan,
        mssv,
        ho_ten,
        email,
        khoa
      )
    `
    )
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .order('thoi_gian_tao', { ascending: true })
    .range(0, 9999);

  if (error) throw error;

  const participants = (data || []).map((item, idx) => ({
    stt: idx + 1,
    ma_dang_ky: item.ma_dang_ky,
    ma_qr_code: item.ma_qr_code || '',
    mssv: item.tai_khoan?.mssv || '',
    ho_ten: item.tai_khoan?.ho_ten || '',
    email: item.tai_khoan?.email || '',
    khoa: item.tai_khoan?.khoa || '',
    trang_thai_ve: item.trang_thai_ve,
    trang_thai_text: STATUS_TEXT_MAP[item.trang_thai_ve] || item.trang_thai_ve,
    thoi_gian_tao: formatDateTime(item.thoi_gian_tao),
    thoi_gian_check_in: formatDateTime(item.thoi_gian_check_in),
  }));

  return { event, participants };
};

/**
 * Xuất danh sách người tham gia dạng CSV (có UTF-8 BOM)
 */
const exportParticipantsCSV = async (eventId, actorId) => {
  const { event, participants } = await getParticipantsForExport(eventId, actorId);

  const headers = [
    'STT',
    'MSSV',
    'Họ tên',
    'Email',
    'Khoa',
    'Trạng thái vé',
    'Thời gian đặt',
    'Thời gian check-in',
  ];

  const rows = participants.map((p) => [
    p.stt,
    escapeCSV(p.mssv),
    escapeCSV(p.ho_ten),
    escapeCSV(p.email),
    escapeCSV(p.khoa),
    escapeCSV(p.trang_thai_text),
    escapeCSV(p.thoi_gian_tao),
    escapeCSV(p.thoi_gian_check_in),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Đính kèm UTF-8 BOM (\uFEFF) ở đầu để Excel nhận diện đúng tiếng Việt UTF-8
  const buffer = Buffer.from('\uFEFF' + csvContent, 'utf8');

  return {
    buffer,
    filename: `participants-event-${eventId}.csv`,
    total: participants.length,
    eventName: event.ten_su_kien,
  };
};

/**
 * Xuất danh sách người tham gia dạng XLSX (Excel)
 */
const exportParticipantsXLSX = async (eventId, actorId) => {
  const { event, participants } = await getParticipantsForExport(eventId, actorId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CampusEventHub';
  workbook.lastModifiedBy = 'CampusEventHub';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Danh sách tham gia', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'MSSV', key: 'mssv', width: 15 },
    { header: 'Họ tên', key: 'ho_ten', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Khoa', key: 'khoa', width: 20 },
    { header: 'Trạng thái vé', key: 'trang_thai_text', width: 18 },
    { header: 'Thời gian đặt', key: 'thoi_gian_tao', width: 22 },
    { header: 'Thời gian check-in', key: 'thoi_gian_check_in', width: 22 },
  ];

  // Định dạng Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Brand Indigo #4f46e5
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE0E7FF' } },
      left: { style: 'thin', color: { argb: 'FFE0E7FF' } },
      bottom: { style: 'medium', color: { argb: 'FF4338CA' } },
      right: { style: 'thin', color: { argb: 'FFE0E7FF' } },
    };
  });

  // Thêm Data Rows
  participants.forEach((p, idx) => {
    const row = worksheet.addRow({
      stt: p.stt,
      mssv: p.mssv,
      ho_ten: p.ho_ten,
      email: p.email,
      khoa: p.khoa,
      trang_thai_text: p.trang_thai_text,
      thoi_gian_tao: p.thoi_gian_tao,
      thoi_gian_check_in: p.thoi_gian_check_in,
    });

    row.height = 22;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF9FAFB';

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      cell.font = { size: 10, name: 'Calibri' };

      if ([1, 2, 6, 7, 8].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
    filename: `participants-event-${eventId}.xlsx`,
    total: participants.length,
    eventName: event.ten_su_kien,
  };
};

module.exports = {
  exportParticipantsCSV,
  exportParticipantsXLSX,
  getParticipantsForExport,
  _verifyEventOwnership,
  STATUS_TEXT_MAP,
  escapeCSV,
  formatDateTime,
};
