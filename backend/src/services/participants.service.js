const supabasePkg = require('../config/supabase.js');
const supabase = supabasePkg.supabase || supabasePkg;

/**
 * Lấy danh sách người tham gia theo sự kiện
 * @param {number} eventId - ID sự kiện
 * @param {object} filters - { status, search, page, limit }
 * @returns {{ data: array, total: number }}
 */
const getParticipants = async (eventId, { status, search, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  // Build query với join tai_khoan
  let query = supabase
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
    `,
      { count: 'exact' }
    )
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .order('thoi_gian_tao', { ascending: false });

  // Filter theo trạng thái vé (phải trước .range() vì .range() terminate chain)
  if (status) {
    query = query.eq('trang_thai_ve', status);
  }

  // Phân trang - đặt cuối cùng để terminate chain
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  // Nếu có search query, lọc phía app (Supabase không hỗ trợ OR trên nested table trực tiếp)
  let result = data || [];
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.tai_khoan?.mssv?.toLowerCase().includes(q) ||
        item.tai_khoan?.ho_ten?.toLowerCase().includes(q)
    );
  }

  // Flatten cấu trúc để dễ dùng ở FE
  const flatResult = result.map((item) => ({
    ma_dang_ky: item.ma_dang_ky,
    ma_qr_code: item.ma_qr_code,
    trang_thai_ve: item.trang_thai_ve,
    thoi_gian_tao: item.thoi_gian_tao,
    thoi_gian_check_in: item.thoi_gian_check_in,
    thoi_gian_huy: item.thoi_gian_huy,
    ghi_chu: item.ghi_chu,
    ma_tai_khoan: item.tai_khoan?.ma_tai_khoan,
    mssv: item.tai_khoan?.mssv,
    ho_ten: item.tai_khoan?.ho_ten,
    email: item.tai_khoan?.email,
    khoa: item.tai_khoan?.khoa,
  }));

  return {
    data: flatResult,
    total: search ? flatResult.length : (count ?? 0),
    page,
    limit,
  };
};

/**
 * Đổi trạng thái vé thủ công (BTC can thiệp)
 * @param {number} ticketId - ma_dang_ky
 * @param {string} newStatus - 'DaDangKy' | 'DaCheckIn' | 'DaHuy'
 * @param {number} actorId - req.user.id (BTC thực hiện)
 * @returns {object} bản ghi dang_ky đã cập nhật
 */
const changeTicketStatus = async (ticketId, newStatus, actorId) => {
  const validStatuses = ['DaDangKy', 'DaCheckIn', 'DaHuy'];
  if (!validStatuses.includes(newStatus)) {
    const err = new Error(`Trạng thái vé không hợp lệ: ${newStatus}`);
    err.code = 'INVALID_STATUS';
    throw err;
  }

  // Lấy ticket hiện tại để kiểm tra tồn tại và ownership qua su_kien
  const { data: ticket, error: fetchErr } = await supabase
    .from('dang_ky')
    .select('ma_dang_ky, trang_thai_ve, ma_su_kien, da_xoa')
    .eq('ma_dang_ky', ticketId)
    .eq('da_xoa', false)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  if (!ticket) {
    const err = new Error('Vé không tồn tại hoặc đã bị xóa');
    err.code = 'TICKET_NOT_FOUND';
    throw err;
  }

  // Kiểm tra BTC có sở hữu sự kiện này không
  const { data: event, error: eventErr } = await supabase
    .from('su_kien')
    .select('ma_tai_khoan_to_chuc')
    .eq('ma_su_kien', ticket.ma_su_kien)
    .eq('da_xoa', false)
    .maybeSingle();

  if (eventErr) throw eventErr;

  if (!event || event.ma_tai_khoan_to_chuc !== actorId) {
    const err = new Error('Bạn không có quyền chỉnh sửa vé của sự kiện này');
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Build update payload theo trạng thái
  const updatePayload = { trang_thai_ve: newStatus };
  if (newStatus === 'DaCheckIn') {
    updatePayload.thoi_gian_check_in = new Date().toISOString();
  }
  if (newStatus === 'DaHuy') {
    updatePayload.thoi_gian_huy = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await supabase
    .from('dang_ky')
    .update(updatePayload)
    .eq('ma_dang_ky', ticketId)
    .select()
    .single();

  if (updateErr) throw updateErr;

  return updated;
};

module.exports = {
  getParticipants,
  changeTicketStatus,
};
