const express = require("express");

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const authenticate = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const {
  registerSchema,
  loginSchema,
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
  validate(loginSchema),
  authController.login
);

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

module.exports = router;