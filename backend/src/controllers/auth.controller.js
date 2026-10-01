const authService = require("../services/auth.service");

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

module.exports = {
  register,
  login,
};