const argon2 = require("argon2");

const supabase = require("../config/supabase");

const { generateOtp } = require("../utils/otp");

const {
  generatePasswordResetToken,
  verifyPasswordResetToken,
} = require("../utils/jwt");

const {
  sendPasswordResetOtp,
} = require("./email.service");

function createServiceError(
  message,
  statusCode,
  code
) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
}

// ==========================================
// REQUEST OTP
// ==========================================

async function requestPasswordResetOtp({
  email,
}) {
  const normalizedEmail =
    email.toLowerCase().trim();

  // 1. Tìm tài khoản
  const {
    data: user,
    error: userError,
  } = await supabase
    .from("tai_khoan")
    .select(`
      ma_tai_khoan,
      email,
      trang_thai_tai_khoan,
      da_xoa
    `)
    .eq("email", normalizedEmail)
    .eq("da_xoa", false)
    .maybeSingle();

  if (userError) {
    throw createServiceError(
      `Không thể kiểm tra tài khoản: ${userError.message}`,
      500,
      "ACCOUNT_LOOKUP_ERROR"
    );
  }

  // Không tiết lộ email có tồn tại hay không
  if (
    !user ||
    user.trang_thai_tai_khoan !==
      "HoatDong"
  ) {
    return;
  }

  // 2. Vô hiệu OTP cũ chưa sử dụng
  const {
    error: invalidateError,
  } = await supabase
    .from("otp_quen_mat_khau")
    .update({
      da_su_dung: true,
    })
    .eq("email", normalizedEmail)
    .eq("da_su_dung", false);

  if (invalidateError) {
    throw createServiceError(
      `Không thể vô hiệu OTP cũ: ${invalidateError.message}`,
      500,
      "OTP_INVALIDATE_ERROR"
    );
  }

  // 3. Sinh OTP
  const otp = generateOtp();

  // 4. Hash OTP
  const otpHash =
    await argon2.hash(otp);

  // 5. Thời gian hết hạn
  const expiresMinutes = Number(
    process.env.OTP_EXPIRES_MINUTES || 10
  );

  const expiresAt = new Date(
    Date.now() +
      expiresMinutes * 60 * 1000
  ).toISOString();

  // 6. Lưu OTP hash
  const {
    data: otpRecord,
    error: insertError,
  } = await supabase
    .from("otp_quen_mat_khau")
    .insert({
      email: normalizedEmail,
      ma_code: otpHash,
      thoi_gian_het_han: expiresAt,
      da_su_dung: false,
    })
    .select("ma_otp")
    .single();

  if (insertError) {
    throw createServiceError(
      `Không thể tạo OTP: ${insertError.message}`,
      500,
      "OTP_CREATE_ERROR"
    );
  }

  // 7. Gửi OTP
  try {
    await sendPasswordResetOtp(
      normalizedEmail,
      otp
    );
  } catch (error) {
    // Gửi thất bại → OTP không còn hợp lệ
    await supabase
      .from("otp_quen_mat_khau")
      .update({
        da_su_dung: true,
      })
      .eq(
        "ma_otp",
        otpRecord.ma_otp
      );

    throw createServiceError(
      "Không thể gửi mã OTP",
      500,
      "OTP_SEND_ERROR"
    );
  }
}

// ==========================================
// VERIFY OTP
// ==========================================

async function verifyPasswordResetOtp({
  email,
  otp,
}) {
  const normalizedEmail =
    email.toLowerCase().trim();

  // 1. Tìm account
  const {
    data: user,
    error: userError,
  } = await supabase
    .from("tai_khoan")
    .select(`
      ma_tai_khoan,
      email,
      trang_thai_tai_khoan,
      da_xoa
    `)
    .eq("email", normalizedEmail)
    .eq("da_xoa", false)
    .maybeSingle();

  if (userError) {
    throw createServiceError(
      "Không thể kiểm tra tài khoản",
      500,
      "ACCOUNT_LOOKUP_ERROR"
    );
  }

  if (
    !user ||
    user.trang_thai_tai_khoan !==
      "HoatDong"
  ) {
    throw createServiceError(
      "OTP không hợp lệ hoặc đã hết hạn",
      400,
      "INVALID_OTP"
    );
  }

  // 2. Lấy OTP mới nhất chưa dùng
  const {
    data: otpRecords,
    error: otpError,
  } = await supabase
    .from("otp_quen_mat_khau")
    .select(`
      ma_otp,
      email,
      ma_code,
      thoi_gian_het_han,
      da_su_dung,
      thoi_gian_tao
    `)
    .eq("email", normalizedEmail)
    .eq("da_su_dung", false)
    .order(
      "thoi_gian_tao",
      {
        ascending: false,
      }
    )
    .limit(1);

  if (otpError) {
    throw createServiceError(
      "Không thể kiểm tra OTP",
      500,
      "OTP_LOOKUP_ERROR"
    );
  }

  const otpRecord =
    otpRecords?.[0];

  if (!otpRecord) {
    throw createServiceError(
      "OTP không hợp lệ hoặc đã hết hạn",
      400,
      "INVALID_OTP"
    );
  }

  // 3. Kiểm tra hết hạn
  const expiresAt =
    new Date(
      otpRecord.thoi_gian_het_han
    ).getTime();

  if (expiresAt <= Date.now()) {
    await supabase
      .from("otp_quen_mat_khau")
      .update({
        da_su_dung: true,
      })
      .eq(
        "ma_otp",
        otpRecord.ma_otp
      );

    throw createServiceError(
      "OTP đã hết hạn",
      400,
      "OTP_EXPIRED"
    );
  }

  // 4. Verify OTP hash
  let validOtp = false;

  try {
    validOtp =
      await argon2.verify(
        otpRecord.ma_code,
        otp
      );
  } catch (error) {
    validOtp = false;
  }

  if (!validOtp) {
    throw createServiceError(
      "OTP không chính xác",
      400,
      "INVALID_OTP"
    );
  }

  // 5. OTP đúng → cấp resetToken
  //
  // CHƯA đánh dấu OTP đã sử dụng.
  // OTP chỉ được consume khi reset password thành công.
  const resetToken =
    generatePasswordResetToken(
      user.ma_tai_khoan,
      otpRecord.ma_otp
    );

  return {
    resetToken,
  };
}

// ==========================================
// RESET PASSWORD
// ==========================================

async function resetPassword({
  resetToken,
  newPassword,
}) {
  let payload;

  // 1. Verify reset token
  try {
    payload =
      verifyPasswordResetToken(
        resetToken
      );
  } catch (error) {
    if (
      error.name ===
      "TokenExpiredError"
    ) {
      throw createServiceError(
        "Reset token đã hết hạn",
        401,
        "RESET_TOKEN_EXPIRED"
      );
    }

    throw createServiceError(
      "Reset token không hợp lệ",
      401,
      "INVALID_RESET_TOKEN"
    );
  }

  const accountId =
    Number(payload.sub);

  const otpId =
    Number(payload.otpId);

  if (
    !Number.isInteger(accountId) ||
    !Number.isInteger(otpId)
  ) {
    throw createServiceError(
      "Reset token không hợp lệ",
      401,
      "INVALID_RESET_TOKEN"
    );
  }

  // 2. Tìm account
  const {
    data: user,
    error: userError,
  } = await supabase
    .from("tai_khoan")
    .select(`
      ma_tai_khoan,
      email,
      trang_thai_tai_khoan,
      da_xoa
    `)
    .eq(
      "ma_tai_khoan",
      accountId
    )
    .eq("da_xoa", false)
    .maybeSingle();

  if (userError) {
    throw createServiceError(
      "Không thể kiểm tra tài khoản",
      500,
      "ACCOUNT_LOOKUP_ERROR"
    );
  }

  if (
    !user ||
    user.trang_thai_tai_khoan !==
      "HoatDong"
  ) {
    throw createServiceError(
      "Reset token không hợp lệ",
      401,
      "INVALID_RESET_TOKEN"
    );
  }

  // 3. Kiểm tra OTP gắn với token
  const {
    data: otpRecord,
    error: otpError,
  } = await supabase
    .from("otp_quen_mat_khau")
    .select(`
      ma_otp,
      email,
      thoi_gian_het_han,
      da_su_dung
    `)
    .eq("ma_otp", otpId)
    .eq("email", user.email)
    .eq("da_su_dung", false)
    .maybeSingle();

  if (otpError) {
    throw createServiceError(
      "Không thể kiểm tra OTP",
      500,
      "OTP_LOOKUP_ERROR"
    );
  }

  if (!otpRecord) {
    throw createServiceError(
      "OTP đã được sử dụng hoặc không còn hợp lệ",
      401,
      "OTP_ALREADY_USED"
    );
  }

  // 4. Kiểm tra OTP hết hạn
  if (
    new Date(
      otpRecord.thoi_gian_het_han
    ).getTime() <= Date.now()
  ) {
    await supabase
      .from("otp_quen_mat_khau")
      .update({
        da_su_dung: true,
      })
      .eq("ma_otp", otpId);

    throw createServiceError(
      "OTP đã hết hạn",
      401,
      "OTP_EXPIRED"
    );
  }

  // 5. Hash password mới trước
  const passwordHash =
    await argon2.hash(
      newPassword
    );

  // 6. Consume OTP bằng điều kiện
  // da_su_dung = false
  //
  // Giúp chống 2 request reset cùng lúc.
  const {
    data: consumedOtp,
    error: consumeError,
  } = await supabase
    .from("otp_quen_mat_khau")
    .update({
      da_su_dung: true,
    })
    .eq("ma_otp", otpId)
    .eq("email", user.email)
    .eq("da_su_dung", false)
    .select("ma_otp")
    .maybeSingle();

  if (consumeError) {
    throw createServiceError(
      "Không thể xác nhận OTP",
      500,
      "OTP_CONSUME_ERROR"
    );
  }

  if (!consumedOtp) {
    throw createServiceError(
      "OTP đã được sử dụng",
      401,
      "OTP_ALREADY_USED"
    );
  }

  // 7. Update password
  const {
    error: updateError,
  } = await supabase
    .from("tai_khoan")
    .update({
      mat_khau: passwordHash,
      thoi_gian_cap_nhat:
        new Date().toISOString(),
    })
    .eq(
      "ma_tai_khoan",
      accountId
    )
    .eq("da_xoa", false);

  if (updateError) {
    throw createServiceError(
      "Không thể cập nhật mật khẩu",
      500,
      "PASSWORD_UPDATE_ERROR"
    );
  }

  // 8. Vô hiệu toàn bộ OTP còn lại
  await supabase
    .from("otp_quen_mat_khau")
    .update({
      da_su_dung: true,
    })
    .eq("email", user.email)
    .eq("da_su_dung", false);
}

module.exports = {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
};