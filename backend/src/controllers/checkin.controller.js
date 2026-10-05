const supabase = require('../config/supabase');

// 1. Lấy danh sách sự kiện mà nhân viên này được phân công check-in
const getMyCheckinEvents = async (req, res) => {
  try {
    const staffAccountId = req.user.id;

    // Lấy danh sách ma_su_kien từ bảng nhan_vien_check_in
    const { data: assignments, error: assignError } = await supabase
      .from('nhan_vien_check_in')
      .select('ma_su_kien')
      .eq('ma_tai_khoan', staffAccountId)
      .eq('da_xoa', false);

    if (assignError) throw assignError;

    if (!assignments || assignments.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const eventIds = assignments.map(a => a.ma_su_kien);

    // Lấy thông tin chi tiết của các sự kiện đó
    const { data: events, error: eventError } = await supabase
      .from('su_kien')
      .select('ma_su_kien, ten_su_kien, thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem, phong, so_luong_dang_ky, so_luong_tham_gia, trang_thai')
      .in('ma_su_kien', eventIds)
      .eq('da_xoa', false);

    if (eventError) throw eventError;

    // Map lại format để Frontend hiển thị dễ dàng
    const mappedEvents = events.map(e => ({
      id: e.ma_su_kien,
      title: e.ten_su_kien,
      date: e.thoi_gian_bat_dau,
      room: e.phong,
      registered: e.so_luong_dang_ky || 0,
      checkedIn: e.so_luong_tham_gia || 0,
      status: e.trang_thai
    }));

    return res.status(200).json({ success: true, data: mappedEvents });
  } catch (error) {
    console.error('getCheckinEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. Quét mã QR để điểm danh
const scanQRCode = async (req, res) => {
  try {
    const staffAccountId = req.user.id;
    const { event_id, qr_code } = req.body;

    if (!event_id || !qr_code) {
      return res.status(400).json({ success: false, message: 'Thiếu event_id hoặc qr_code' });
    }

    // 2.1 Kiểm tra nhân viên có quyền check-in sự kiện này không
    const { data: assignment, error: assignError } = await supabase
      .from('nhan_vien_check_in')
      .select('ma_nhan_vien')
      .eq('ma_tai_khoan', staffAccountId)
      .eq('ma_su_kien', event_id)
      .eq('da_xoa', false)
      .single();

    if (assignError || !assignment) {
      return res.status(403).json({ success: false, message: 'Bạn không được phân công trực sự kiện này' });
    }

    // 2.2 Tìm vé đăng ký theo mã QR
    const { data: ticket, error: ticketError } = await supabase
      .from('dang_ky')
      .select('ma_dang_ky, trang_thai_ve, ma_su_kien, tai_khoan(ho_ten, mssv)')
      .eq('ma_qr_code', qr_code)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vé hợp lệ với mã QR này' });
    }

    if (ticket.ma_su_kien !== parseInt(event_id)) {
      return res.status(400).json({ success: false, message: 'Vé này không thuộc về sự kiện hiện tại' });
    }

    if (ticket.trang_thai_ve === 'DaCheckIn') {
      return res.status(400).json({ success: false, message: 'Vé này đã được điểm danh trước đó!' });
    }
    
    if (ticket.trang_thai_ve === 'DaHuy') {
      return res.status(400).json({ success: false, message: 'Vé này đã bị hủy!' });
    }

    // 2.3 Cập nhật trạng thái vé thành DaCheckIn
    const { error: updateError } = await supabase
      .from('dang_ky')
      .update({ trang_thai_ve: 'DaCheckIn', thoi_gian_check_in: new Date().toISOString() })
      .eq('ma_dang_ky', ticket.ma_dang_ky);

    if (updateError) throw updateError;

    // TODO: (Tùy chọn) Tăng so_luong_tham_gia trong bảng su_kien lên 1 bằng RPC

    return res.status(200).json({
      success: true,
      message: 'Điểm danh thành công',
      data: {
        ho_ten: ticket.tai_khoan?.ho_ten,
        mssv: ticket.tai_khoan?.mssv,
        thoi_gian: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('scanQRCode Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getMyCheckinEvents,
  scanQRCode
};
