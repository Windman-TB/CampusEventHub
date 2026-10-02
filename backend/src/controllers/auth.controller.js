const authService = require("../services/auth.service");

const otpService =
  require("../services/otp.service");

// ==============================
// REGISTER
// ==============================

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Đăng ký tài khoản thất bại",
      error: error.code
        ? {
            code: error.code,
          }
        : null,
    });
  }
}

// ==============================
// LOGIN
// ==============================

async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Đăng nhập thất bại",
      error: error.code
        ? {
            code: error.code,
          }
        : null,
    });
  }
}

// ========================================
// REQUEST PASSWORD RESET OTP
// ========================================

async function requestPasswordResetOtp(
  req,
  res
) {
  try {
    await otpService
      .requestPasswordResetOtp(
        req.body
      );

    // Cố ý trả cùng response dù email
    // có tồn tại hay không.
    return res.status(200).json({
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi",
    });
  } catch (error) {
    console.error(
      "Request OTP error:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Không thể gửi OTP",
        error: error.code
          ? {
              code: error.code,
            }
          : null,
      });
  }
}

// ========================================
// VERIFY PASSWORD RESET OTP
// ========================================

async function verifyPasswordResetOtp(
  req,
  res
) {
  try {
    const result =
      await otpService
        .verifyPasswordResetOtp(
          req.body
        );

    return res.status(200).json({
      success: true,
      message:
        "Xác thực OTP thành công",
      data: result,
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Xác thực OTP thất bại",
        error: error.code
          ? {
              code: error.code,
            }
          : null,
      });
  }
}

// ========================================
// RESET PASSWORD
// ========================================

async function resetPassword(
  req,
  res
) {
  try {
    await otpService.resetPassword(
      req.body
    );

    return res.status(200).json({
      success: true,
      message:
        "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res
      .status(
        error.statusCode || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Đặt lại mật khẩu thất bại",
        error: error.code
          ? {
              code: error.code,
            }
          : null,
      });
  }
}

module.exports = {
  register,
  login,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
};