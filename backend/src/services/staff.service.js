const supabasePkg = require('../config/supabase.js');
const supabase = supabasePkg.supabase || supabasePkg;

// ==========================================
// HELPERS
// ==========================================

/**
 * Verify sự kiện tồn tại và thuộc về actorId
 * @throws { code: 'EVENT_NOT_FOUND' | 'FORBIDDEN' }
 */
const _verifyEventOwnership = async (eventId, actorId) => {
  const { data: event, error } = await supabase
    .from('su_kien')
    .select('ma_su_kien, ma_tai_khoan_to_chuc')
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
    const err = new Error('Bạn không có quyền quản lý nhân viên sự kiện này');
    err.code = 'FORBIDDEN';
    throw err;
  }

  return event;
};

// ==========================================
// 1. TÌM KIẾM SINH VIÊN THEO MSSV / TÊN
// ==========================================

/**
 * Tìm kiếm sinh viên trong bảng tai_khoan theo MSSV hoặc họ tên
 * Trả về tối đa 10 kết quả để hiển thị gợi ý trong Modal
 * @param {string} query - MSSV hoặc họ tên cần tìm
 * @returns {Array} danh sách sinh viên phù hợp
 */
const searchStudents = async (query) => {
  const q = (query || '').trim();

  // Trả về rỗng nếu query quá ngắn (tránh full-table scan)
  if (q.length < 2) return [];

  // Tìm theo MSSV (exact prefix) hoặc họ tên (case-insensitive)
  // Supabase: .or() nhận filter string
  const { data, error } = await supabase
    .from('tai_khoan')
    .select('ma_tai_khoan, mssv, ho_ten, email, khoa, loai_tai_khoan')
    .or(`mssv.ilike.%${q}%,ho_ten.ilike.%${q}%`)
    .eq('da_xoa', false)
    .eq('trang_thai_tai_khoan', 'HoatDong')
    .limit(10);

  if (error) throw error;

  return (data || []).map((tk) => ({
    ma_tai_khoan: tk.ma_tai_khoan,
    mssv: tk.mssv,
    ho_ten: tk.ho_ten,
    email: tk.email,
    khoa: tk.khoa,
    loai_tai_khoan: tk.loai_tai_khoan,
  }));
};

// ==========================================
// 2. LẤY DANH SÁCH STAFF THEO SỰ KIỆN
// ==========================================

/**
 * Lấy danh sách nhân viên được phân công soát vé cho sự kiện
 * @param {number} eventId
 * @param {number} actorId - BTC đang đăng nhập (ownership check)
 * @returns {Array} danh sách staff
 */
const getStaffByEvent = async (eventId, actorId) => {
  await _verifyEventOwnership(eventId, actorId);

  const { data, error } = await supabase
    .from('nhan_vien_check_in')
    .select(
      `
      ma_nhan_vien,
      thoi_gian_tao,
      tai_khoan (
        ma_tai_khoan,
        mssv,
        ho_ten,
        email,
        khoa,
        loai_tai_khoan
      )
    `
    )
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .order('thoi_gian_tao', { ascending: false })
    .range(0, 999); // max 1000 records per event

  if (error) throw error;

  return (data || []).map((item) => ({
    ma_nhan_vien: item.ma_nhan_vien,
    thoi_gian_tao: item.thoi_gian_tao,
    ma_tai_khoan: item.tai_khoan?.ma_tai_khoan,
    mssv: item.tai_khoan?.mssv,
    ho_ten: item.tai_khoan?.ho_ten,
    email: item.tai_khoan?.email,
    khoa: item.tai_khoan?.khoa,
    loai_tai_khoan: item.tai_khoan?.loai_tai_khoan,
  }));
};

// ==========================================
// 3. PHÂN CÔNG NHÂN VIÊN (ASSIGN STAFF)
// ==========================================

/**
 * Gán quyền check-in sự kiện cho một tài khoản theo ma_tai_khoan
 * @param {number} eventId
 * @param {number} maTaiKhoan - ID tài khoản được gán quyền
 * @param {number} actorId - BTC đang đăng nhập
 * @returns {object} bản ghi nhan_vien_check_in mới
 * @throws { code: 'EVENT_NOT_FOUND' | 'FORBIDDEN' | 'STUDENT_NOT_FOUND' | 'ALREADY_ASSIGNED' }
 */
const assignStaff = async (eventId, maTaiKhoan, actorId) => {
  // 1. Ownership check
  await _verifyEventOwnership(eventId, actorId);

  // 2. Kiểm tra tài khoản được gán tồn tại và đang hoạt động
  const { data: targetAccount, error: accountErr } = await supabase
    .from('tai_khoan')
    .select('ma_tai_khoan, ho_ten, mssv, trang_thai_tai_khoan')
    .eq('ma_tai_khoan', maTaiKhoan)
    .eq('da_xoa', false)
    .maybeSingle();

  if (accountErr) throw accountErr;

  if (!targetAccount) {
    const err = new Error('Tài khoản không tồn tại');
    err.code = 'STUDENT_NOT_FOUND';
    throw err;
  }

  if (targetAccount.trang_thai_tai_khoan !== 'HoatDong') {
    const err = new Error(`Tài khoản "${targetAccount.ho_ten}" đang bị khóa, không thể phân công`);
    err.code = 'ACCOUNT_LOCKED';
    throw err;
  }

  // 3. Kiểm tra đã được gán chưa (active records — partial unique index)
  const { data: existing, error: existErr } = await supabase
    .from('nhan_vien_check_in')
    .select('ma_nhan_vien')
    .eq('ma_tai_khoan', maTaiKhoan)
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .maybeSingle();

  if (existErr) throw existErr;

  if (existing) {
    const err = new Error(
      `Sinh viên "${targetAccount.ho_ten}" đã được phân công cho sự kiện này rồi`
    );
    err.code = 'ALREADY_ASSIGNED';
    throw err;
  }

  // 4. Thêm bản ghi mới
  const { data: newStaff, error: insertErr } = await supabase
    .from('nhan_vien_check_in')
    .insert([{ ma_tai_khoan: maTaiKhoan, ma_su_kien: eventId }])
    .select(
      `
      ma_nhan_vien,
      thoi_gian_tao,
      tai_khoan (
        ma_tai_khoan,
        mssv,
        ho_ten,
        email,
        khoa,
        loai_tai_khoan
      )
    `
    )
    .single();

  if (insertErr) {
    // The pre-check improves the usual response, while the partial unique
    // index remains the source of truth if two assignments race.
    if (insertErr.code === '23505') {
      const err = new Error(
        `Sinh viên "${targetAccount.ho_ten}" đã được phân công cho sự kiện này rồi`
      );
      err.code = 'ALREADY_ASSIGNED';
      throw err;
    }
    throw insertErr;
  }

  return {
    ma_nhan_vien: newStaff.ma_nhan_vien,
    thoi_gian_tao: newStaff.thoi_gian_tao,
    ma_tai_khoan: newStaff.tai_khoan?.ma_tai_khoan,
    mssv: newStaff.tai_khoan?.mssv,
    ho_ten: newStaff.tai_khoan?.ho_ten,
    email: newStaff.tai_khoan?.email,
    khoa: newStaff.tai_khoan?.khoa,
    loai_tai_khoan: newStaff.tai_khoan?.loai_tai_khoan,
  };
};

// ==========================================
// 4. THU HỒI QUYỀN NHÂN VIÊN (REVOKE STAFF)
// ==========================================

/**
 * Soft-delete bản ghi nhan_vien_check_in (thu hồi quyền)
 * Sau khi revoke, DB không vi phạm unique constraint nên có thể gán lại.
 * @param {number} eventId
 * @param {number} staffId - ma_nhan_vien
 * @param {number} actorId - BTC đang đăng nhập
 * @throws { code: 'EVENT_NOT_FOUND' | 'FORBIDDEN' | 'STAFF_NOT_FOUND' }
 */
const revokeStaff = async (eventId, staffId, actorId) => {
  // 1. Ownership check
  await _verifyEventOwnership(eventId, actorId);

  // 2. Kiểm tra record tồn tại và thuộc đúng sự kiện
  const { data: staffRecord, error: fetchErr } = await supabase
    .from('nhan_vien_check_in')
    .select('ma_nhan_vien, ma_su_kien, da_xoa')
    .eq('ma_nhan_vien', staffId)
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  if (!staffRecord) {
    const err = new Error('Nhân viên không tồn tại trong sự kiện này hoặc đã bị thu hồi quyền');
    err.code = 'STAFF_NOT_FOUND';
    throw err;
  }

  // 3. Soft-delete
  const { data: revokedStaff, error: updateErr } = await supabase
    .from('nhan_vien_check_in')
    .update({ da_xoa: true })
    .eq('ma_nhan_vien', staffId)
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .select('ma_nhan_vien')
    .maybeSingle();

  if (updateErr) throw updateErr;
  if (!revokedStaff) {
    const err = new Error('Nhân viên không tồn tại trong sự kiện này hoặc đã bị thu hồi quyền');
    err.code = 'STAFF_NOT_FOUND';
    throw err;
  }

  return { revoked: true, ma_nhan_vien: staffId };
};

module.exports = {
  searchStudents,
  getStaffByEvent,
  assignStaff,
  revokeStaff,
  // Export internal helper for testing
  _verifyEventOwnership,
};
