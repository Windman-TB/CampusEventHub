const crypto = require('crypto');
const supabase = require('../config/supabase');

const {
  sendBookingConfirmation,
} = require('./mail.service');

// ============================================================
// TẠO QR CODE TOKEN BẢO MẬT
// ============================================================

const generateSecureQRCode = (userId, eventId) => {
  const rawData =
    `${userId}-${eventId}-${Date.now()}-${crypto.randomUUID()}`;

  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error(
      'Thiếu JWT_SECRET trong environment variables'
    );
  }

  return crypto
    .createHmac('sha256', secretKey)
    .update(rawData)
    .digest('hex');
};

// ============================================================
// GỬI EMAIL XÁC NHẬN ĐẶT VÉ
// Hàm này chạy riêng, không làm fail quá trình đặt vé
// ============================================================

const sendBookingEmailAsync = async (
  userId,
  eventId,
  ticketId,
  qrCode
) => {
  // 1. Lấy thông tin người dùng
  const {
    data: user,
    error: userError,
  } = await supabase
    .from('tai_khoan')
    .select(`
      ma_tai_khoan,
      ho_ten,
      email
    `)
    .eq('ma_tai_khoan', userId)
    .eq('da_xoa', false)
    .single();

  if (userError) {
    throw userError;
  }

  // 2. Lấy thông tin sự kiện
  const {
    data: event,
    error: eventError,
  } = await supabase
    .from('su_kien')
    .select(`
      ma_su_kien,
      ten_su_kien,
      ngay_dien_ra,
      thoi_gian_bat_dau,
      thoi_gian_ket_thuc,
      dia_diem,
      phong
    `)
    .eq('ma_su_kien', eventId)
    .eq('da_xoa', false)
    .single();

  if (eventError) {
    throw eventError;
  }

  // 3. Gửi email xác nhận
  await sendBookingConfirmation(
    user.email,
    event,
    {
      ticketId,
      qrCode,
    }
  );

  console.log(
    `Đã gửi email xác nhận vé cho ${user.email}`
  );
};

// ============================================================
// ĐẶT VÉ
// ============================================================

const bookTicket = async (
  userId,
  eventId
) => {
  // 1. Sinh mã QR bảo mật
  const qrCode =
    generateSecureQRCode(
      userId,
      eventId
    );

  // 2. Gọi Stored Function chống overbooking
  const {
    data,
    error,
  } = await supabase.rpc(
    'dat_ve_su_kien',
    {
      p_ma_tai_khoan: userId,
      p_ma_su_kien: eventId,
      p_ma_qr_code: qrCode,
    }
  );

  // 3. Lỗi từ Supabase
  if (error) {
    throw new Error(
      error.message ||
        'Lỗi hệ thống khi đặt vé'
    );
  }

  // 4. Stored Function báo thất bại
  if (!data?.success) {
    throw new Error(
      data?.message ||
        'Đặt vé thất bại'
    );
  }

  const ticketId =
    data.ma_dang_ky;

  // 5. Gửi email bất đồng bộ
  // KHÔNG await ở đây
  // Email lỗi vẫn không ảnh hưởng vé đã đặt
  sendBookingEmailAsync(
    userId,
    eventId,
    ticketId,
    qrCode
  ).catch((error) => {
    console.error(
      'Lỗi gửi email xác nhận đặt vé:',
      error.message
    );
  });

  // 6. Trả kết quả đặt vé
  return {
    ticketId,
    qrCode,
    message:
      data?.message ||
      'Đặt vé thành công',
  };
};

// ============================================================
// LẤY DANH SÁCH VÉ CỦA USER
// ============================================================

const getMyTickets = async (
  userId
) => {
  const {
    data,
    error,
  } = await supabase
    .from('dang_ky')
    .select(`
      *,
      su_kien (*)
    `)
    .eq(
      'ma_tai_khoan',
      userId
    )
    .neq(
      'da_xoa',
      true
    )
    .order(
      'thoi_gian_tao',
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return data;
};

// ============================================================
// HỦY VÉ
// ============================================================

const cancelTicket = async (
  userId,
  ticketId
) => {
  const {
    data,
    error,
  } = await supabase
    .from('dang_ky')
    .update({
      trang_thai_ve:
        'DaHuy',

      thoi_gian_huy:
        new Date(),
    })
    .eq(
      'ma_dang_ky',
      ticketId
    )
    .eq(
      'ma_tai_khoan',
      userId
    )
    .eq(
      'trang_thai_ve',
      'DaDangKy'
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      'Không thể hủy vé. Vé đã bị hủy hoặc bạn đã check-in.'
    );
  }

  return data;
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  bookTicket,
  generateSecureQRCode,
  getMyTickets,
  cancelTicket,
};