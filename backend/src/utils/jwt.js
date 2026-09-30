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
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
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

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};