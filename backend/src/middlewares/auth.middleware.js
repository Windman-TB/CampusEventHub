const supabase = require("../config/supabase");
const { verifyAccessToken } = require("../utils/jwt");

async function authenticate(req, res, next) {
  try {
    // 1. Lấy Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    // 2. Authorization phải có dạng:
    // Bearer <token>
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Authorization header không hợp lệ",
      });
    }

    // 3. Verify JWT
    const payload = verifyAccessToken(token);

    const accountId = Number(payload.sub);

    if (!Number.isInteger(accountId)) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    // 4. Lấy tài khoản hiện tại từ database
    const { data: user, error } = await supabase
      .from("tai_khoan")
      .select(`
        ma_tai_khoan,
        mssv,
        email,
        ho_ten,
        loai_tai_khoan,
        trang_thai_tai_khoan,
        da_xoa
      `)
      .eq("ma_tai_khoan", accountId)
      .eq("da_xoa", false)
      .maybeSingle();

    if (error) {
      return next(error);
    }

    // 5. Không tìm thấy tài khoản
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    // 6. Tài khoản bị khóa
    if (user.trang_thai_tai_khoan !== "HoatDong") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    // 7. Gắn user vào request
    req.user = {
      id: user.ma_tai_khoan,
      mssv: user.mssv,
      email: user.email,
      ho_ten: user.ho_ten,
      role: user.loai_tai_khoan,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã hết hạn",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    next(error);
  }
}

module.exports = authenticate;