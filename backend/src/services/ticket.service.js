const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendTicketEmail } = require('./mail.service'); // Đã bật cho Gói 4 & 6

/**
 * Service sinh mã QR Code bảo mật bằng HMAC SHA-256
 */
const generateSecureQRCode = (userId, eventId) => {
    const rawData = `${userId}-${eventId}-${Date.now()}-${crypto.randomUUID()}`;
    const secretKey = process.env.JWT_SECRET || 'campus-event-hub-secret-key-default';
    
    // Hash thông tin vé để tạo chuỗi bảo mật chống làm giả
    const qrCodeHash = crypto.createHmac('sha256', secretKey)
                            .update(rawData)
                            .digest('hex');
    
    return qrCodeHash;
};

/**
 * Gọi Stored Function dat_ve_su_kien trên Supabase
 */
const bookTicket = async (userId, eventId) => {
    // 1. Sinh mã QR bảo mật
    const qrCode = generateSecureQRCode(userId, eventId);

    // 2. Gọi RPC trên Supabase để thực hiện khóa bi quan (Pessimistic Lock)
    const { data, error } = await supabase.rpc('dat_ve_su_kien', {
        p_ma_tai_khoan: userId,
        p_ma_su_kien: eventId,
        p_ma_qr_code: qrCode
    });

    // 3. Xử lý kết quả trả về từ RPC
    if (error) {
        throw new Error(error.message || 'Lỗi hệ thống khi đặt vé');
    }

    if (data && !data.success) {
        throw new Error(data.message || 'Đặt vé thất bại');
    }

    // 4. Gửi email bất đồng bộ - Tích hợp cho Gói 4
    sendTicketEmail(userId, eventId, qrCode).catch(err => console.error("Lỗi gửi email:", err));

    return {
        qrCode,
        message: data?.message || 'Đặt vé thành công'
    };
};

const getMyTickets = async (userId) => {
    const { data, error } = await supabase
        .from('dang_ky')
        .select('*, su_kien(*)')
        .eq('ma_tai_khoan', userId)
        .neq('da_xoa', true)
        .order('thoi_gian_tao', { ascending: false });

    if (error) throw error;
    return data;
};

const cancelTicket = async (userId, ticketId) => {
    const { data, error } = await supabase
        .from('dang_ky')
        .update({ trang_thai_ve: 'DaHuy', thoi_gian_huy: new Date() })
        .eq('ma_dang_ky', ticketId)
        .eq('ma_tai_khoan', userId)
        .eq('trang_thai_ve', 'DaDangKy')
        .select()
        .single();

    if (error) throw new Error('Không thể hủy vé. Vé đã bị hủy hoặc bạn đã check-in.');
    return data;
};

module.exports = {
    bookTicket,
    generateSecureQRCode,
    getMyTickets,
    cancelTicket
};
