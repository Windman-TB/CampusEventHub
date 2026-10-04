const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.ma_tai_khoan),
      type: "access",
      role: user.loai_tai_khoan,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "1h",
    }
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  if (payload.type !== "access") {
    const error = new Error("Token không hợp lệ");
    error.name = "JsonWebTokenError";
    throw error;
  }

  return payload;
}

// ==========================================
// PASSWORD RESET TOKEN
// ==========================================

function generatePasswordResetToken(
  accountId,
  otpId
) {
  return jwt.sign(
    {
      sub: String(accountId),
      type: "password_reset",
      otpId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.RESET_TOKEN_EXPIRES_IN ||
        "10m",
    }
  );
}

function verifyPasswordResetToken(token) {
  const payload = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  if (payload.type !== "password_reset") {
    const error = new Error(
      "Reset token không hợp lệ"
    );

    error.name = "JsonWebTokenError";

    throw error;
  }

  return payload;
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};