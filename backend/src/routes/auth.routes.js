const express = require("express");

const authController = require("../controllers/auth.controller");

const validate = require("../middlewares/validate.middleware");
const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  loginLimiter,
  otpLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} = require("../middlewares/rateLimit.middleware");

const {
  registerSchema,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();

// ==============================
// REGISTER
// POST /api/auth/register
// ==============================

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

// ==============================
// LOGIN
// POST /api/auth/login
// ==============================

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login
);

// ==============================
// DEMO LOGIN (Quick login trên UI)
// POST /api/auth/demo-login
// ==============================

// ==============================
// TEST AUTHENTICATION
// GET /api/auth/check-auth
// ==============================

router.get(
  "/check-auth",
  authenticate,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Authentication thành công",
      data: {
        user: req.user,
      },
    });
  }
);

// ==============================
// TEST RBAC - ORGANIZER
// GET /api/auth/organizer-check
// ==============================

router.get(
  "/organizer-check",
  authenticate,
  authorizeRoles("ToChuc"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Bạn có quyền Ban tổ chức",
      data: {
        user: req.user,
      },
    });
  }
);

// ==============================
// FORGOT PASSWORD - REQUEST OTP
// POST /api/auth/forgot-password/request-otp
// ==============================

router.post(
  "/forgot-password/request-otp",
  otpLimiter,
  validate(requestOtpSchema),
  authController.requestPasswordResetOtp
);

// ==============================
// FORGOT PASSWORD - VERIFY OTP
// POST /api/auth/forgot-password/verify-otp
// ==============================

router.post(
  "/forgot-password/verify-otp",
  verifyOtpLimiter,
  validate(verifyOtpSchema),
  authController.verifyPasswordResetOtp
);

// ==============================
// FORGOT PASSWORD - RESET PASSWORD
// POST /api/auth/forgot-password/reset
// ==============================

router.post(
  "/forgot-password/reset",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;