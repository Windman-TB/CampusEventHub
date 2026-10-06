const { rateLimit } = require("express-rate-limit");

// ==============================
// LOGIN LIMITER
// Tối đa 10 lần / 15 phút / IP
// ==============================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.",
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
    },
  },
});

// ==============================
// REQUEST OTP LIMITER
// Tối đa 5 lần / 10 phút / IP
// ==============================

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.",
    error: {
      code: "TOO_MANY_OTP_REQUESTS",
    },
  },
});

// ==============================
// VERIFY OTP LIMITER
// Tối đa 10 lần / 10 phút / IP
// ==============================

const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Bạn đã nhập OTP sai quá nhiều lần. Vui lòng thử lại sau.",
    error: {
      code: "TOO_MANY_OTP_ATTEMPTS",
    },
  },
});

// ==============================
// RESET PASSWORD LIMITER
// Tối đa 5 request / 10 phút / IP
// ==============================

const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Bạn đã thực hiện quá nhiều yêu cầu đổi mật khẩu. Vui lòng thử lại sau.",
    error: {
      code: "TOO_MANY_PASSWORD_RESET_ATTEMPTS",
    },
  },
});

module.exports = {
  loginLimiter,
  otpLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
};