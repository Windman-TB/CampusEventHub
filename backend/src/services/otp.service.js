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

function createServiceError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

// ==========================================
// REQUEST OTP
// ==========================================

async function requestPasswordResetOtp({ email }) {
  const normalizedEmail = email.toLowerCase().trim();

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

  // Không tiết lộ email có tồn tại hay không.
  if (
    !user ||
    user.trang_thai_tai_khoan !== "HoatDong"
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
  const otpHash = await argon2.hash(otp);

  // 5. Thời gian hết hạn
  const expiresMinutes = Number(
    process.env.OTP_EXPIRES_MINUTES || 10
  );

  const expiresAt = new Date(
    Date.now() + expiresMinutes * 60 * 1000
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
    // Nếu gửi thất bại thì OTP vừa tạo phải bị vô hiệu.
    await supabase
      .from("otp_quen_mat_khau")
      .update({
        da_su_dung: true,
      })
      .eq("ma_otp", otpRecord.ma_otp);

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
  const normalizedEmail = email.toLowerCase().trim();

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
    user.trang_thai_tai_khoan !== "HoatDong"
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
    .order("thoi_gian_tao", {
      ascending: false,
    })
    .limit(1);

  if (otpError) {
    throw createServiceError(
      "Không thể kiểm tra OTP",
      500,
      "OTP_LOOKUP_ERROR"
    );
  }

  const otpRecord = otpRecords?.[0];

  if (!otpRecord) {
    throw createServiceError(
      "OTP không hợp lệ hoặc đã hết hạn",
      400,
      "INVALID_OTP"
    );
  }

  // 3. Kiểm tra hết hạn
  const expiresAt = new Date(
    otpRecord.thoi_gian_het_han
  ).getTime();

  if (expiresAt <= Date.now()) {
    await supabase
      .from("otp_quen_mat_khau")
      .update({
        da_su_dung: true,
      })
      .eq("ma_otp", otpRecord.ma_otp);

    throw createServiceError(
      "OTP đã hết hạn",
      400,
      "OTP_EXPIRED"
    );
  }

  // 4. Verify OTP hash
  let validOtp = false;

  try {
    validOtp = await argon2.verify(
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

  // 5. OTP đúng -> cấp resetToken.
  // Không consume OTP tại bước verify.
  // OTP chỉ được consume atomically cùng password update trong RPC.
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
    payload = verifyPasswordResetToken(
      resetToken
    );
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
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

  const accountId = Number(payload?.sub);
  const otpId = Number(payload?.otpId);

  // Chỉ chấp nhận integer dương.
  if (
    !Number.isInteger(accountId) ||
    accountId <= 0 ||
    !Number.isInteger(otpId) ||
    otpId <= 0
  ) {
    throw createServiceError(
      "Reset token không hợp lệ",
      401,
      "INVALID_RESET_TOKEN"
    );
  }

  // Nếu payload có type thì phải đúng loại password_reset.
  if (
    payload?.type !== undefined &&
    payload.type !== "password_reset"
  ) {
    throw createServiceError(
      "Reset token không hợp lệ",
      401,
      "INVALID_RESET_TOKEN"
    );
  }

  // 2. Hash password mới
  let passwordHash;

  try {
    passwordHash = await argon2.hash(
      newPassword
    );
  } catch (error) {
    throw createServiceError(
      "Không thể mã hóa mật khẩu mới",
      500,
      "PASSWORD_HASH_ERROR"
    );
  }

  // 3. Reset atomically trong PostgreSQL.
  //
  // RPC chịu trách nhiệm:
  // - lock account
  // - lock OTP
  // - kiểm tra account/OTP
  // - kiểm tra OTP đã dùng/hết hạn
  // - update password
  // - consume OTP
  //
  // Không được tự update tai_khoan hoặc otp_quen_mat_khau
  // bằng supabase.from() trong resetPassword().
  let rpcResponse;

  try {
    rpcResponse = await supabase.rpc(
      "reset_password_with_otp",
      {
        p_account_id: accountId,
        p_otp_id: otpId,
        p_password_hash: passwordHash,
      }
    );
  } catch (error) {
    throw createServiceError(
      "Không thể cập nhật mật khẩu",
      500,
      "PASSWORD_UPDATE_ERROR"
    );
  }

  if (
    !rpcResponse ||
    typeof rpcResponse !== "object"
  ) {
    throw createServiceError(
      "Không thể cập nhật mật khẩu",
      500,
      "PASSWORD_UPDATE_ERROR"
    );
  }

  const {
    data,
    error: rpcError,
  } = rpcResponse;

  if (rpcError) {
    throw createServiceError(
      "Không thể cập nhật mật khẩu",
      500,
      "PASSWORD_UPDATE_ERROR"
    );
  }

  // Supabase/PostgREST thường trả object,
  // nhưng test/một số cấu hình có thể trả array 1 phần tử.
  const result = Array.isArray(data)
    ? data[0]
    : data;

  if (
    !result ||
    typeof result !== "object"
  ) {
    throw createServiceError(
      "Không thể cập nhật mật khẩu",
      500,
      "PASSWORD_UPDATE_ERROR"
    );
  }

  // 4. Happy path
  if (
    result.success === true &&
    result.code ===
      "PASSWORD_RESET_SUCCESS"
  ) {
    return;
  }

  // success=true nhưng code không đúng contract.
  if (result.success === true) {
    throw createServiceError(
      "Phản hồi đặt lại mật khẩu không hợp lệ",
      500,
      "PASSWORD_UPDATE_ERROR"
    );
  }

  // 5. Map business errors từ RPC
  switch (result.code) {
    case "INVALID_ACCOUNT":
    case "INVALID_RESET_TOKEN":
      throw createServiceError(
        "Reset token không hợp lệ",
        401,
        "INVALID_RESET_TOKEN"
      );

    case "INVALID_OTP":
      throw createServiceError(
        "OTP không hợp lệ",
        401,
        "INVALID_OTP"
      );

    case "OTP_ALREADY_USED":
      throw createServiceError(
        "OTP đã được sử dụng",
        401,
        "OTP_ALREADY_USED"
      );

    case "OTP_EXPIRED":
      throw createServiceError(
        "OTP đã hết hạn",
        401,
        "OTP_EXPIRED"
      );

    default:
      throw createServiceError(
        "Không thể cập nhật mật khẩu",
        500,
        "PASSWORD_UPDATE_ERROR"
      );
  }
}

module.exports = {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
};
