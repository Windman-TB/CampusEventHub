import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { setStoredRole } from "../utils/authStorage";
import { apiFetch } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  // ==============================
  // Common state
  // ==============================
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==============================
  // Login state
  // ==============================
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // ==============================
  // Register state
  // ==============================
  const [registerForm, setRegisterForm] = useState({
    ho_ten: "",
    mssv: "",
    sdt: "",
    email: "",
    khoa: "Công nghệ Thông tin",
    mat_khau: "",
    xac_nhan_mat_khau: "",
  });

  // ==============================
  // Change tab
  // ==============================
  function handleChangeTab(nextTab) {
    setTab(nextTab);
    setError("");
    setSuccess("");
  }

  // ==============================
  // LOGIN
  // ==============================
  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!identifier.trim() || !password) {
      setError("Vui lòng nhập Email/MSSV và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          mat_khau: password,
        }),
      });

      const accessToken = result?.data?.accessToken;
      const user = result?.data?.user;

      if (!accessToken || !user) {
        throw new Error("Phản hồi đăng nhập từ server không hợp lệ.");
      }

      // ==============================
      // Lưu thông tin xác thực
      // ==============================
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      // Backend:
      // SinhVien / ToChuc / NhanVienCheckIn
      //
      // Frontend hiện tại:
      // student / organizer / staff
      const validRoles = [
        "SinhVien",
        "ToChuc",
        "NhanVienCheckIn",
      ];

      if (
        !validRoles.includes(
          user.loai_tai_khoan
        )
      ) {
        localStorage.removeItem(
          "accessToken"
        );

        localStorage.removeItem(
          "user"
        );

        clearStoredRole?.();

        throw new Error(
          "Loại tài khoản không hợp lệ."
        );
      }

      setStoredRole(
        user.loai_tai_khoan
      );

      const frontendRole = roleMap[user.loai_tai_khoan];

      if (!frontendRole) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        throw new Error("Loại tài khoản không hợp lệ.");
      }

      setStoredRole(frontendRole);

      // ==============================
      // Điều hướng theo role thật
      // ==============================
      switch (user.loai_tai_khoan) {
        case "ToChuc":
          navigate("/dashboard");
          break;

        case "NhanVienCheckIn":
          navigate("/check-in");
          break;

        case "SinhVien":
        default:
          navigate("/home");
          break;
      }
    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      setError(
        err?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // REGISTER
  // ==============================
  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const {
      ho_ten,
      mssv,
      sdt,
      email,
      khoa,
      mat_khau,
      xac_nhan_mat_khau,
    } = registerForm;

    if (
      !ho_ten.trim() ||
      !mssv.trim() ||
      !email.trim() ||
      !mat_khau ||
      !xac_nhan_mat_khau
    ) {
      setError("Vui lòng nhập đầy đủ các thông tin bắt buộc.");
      return;
    }

    if (mat_khau.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (mat_khau !== xac_nhan_mat_khau) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ho_ten: ho_ten.trim(),
          mssv: mssv.trim(),
          email: email.trim().toLowerCase(),
          sdt: sdt.trim() || undefined,
          khoa,
          mat_khau,
        }),
      });

      setSuccess(
        "Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay."
      );

      // Chuyển sang tab Login
      setTab("login");

      // Điền sẵn email vừa đăng ký
      setIdentifier(email.trim().toLowerCase());
      setPassword("");

      // Reset form register
      setRegisterForm({
        ho_ten: "",
        mssv: "",
        sdt: "",
        email: "",
        khoa: "Công nghệ Thông tin",
        mat_khau: "",
        xac_nhan_mat_khau: "",
      });
    } catch (err) {
      setError(
        err?.message ||
          "Đăng ký tài khoản thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // Update register form
  // ==============================
  function updateRegisterField(field, value) {
    setRegisterForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#f8fafc" }}
    >
      {/* ==================================================
          LEFT BRANDING PANEL
      ================================================== */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{
          width: "52%",
          background: "#1a1a2e",
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
            style={{
              background: "#4f46e5",
              filter: "blur(80px)",
            }}
          />

          <div
            className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10"
            style={{
              background: "#0891b2",
              filter: "blur(80px)",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm tracking-tight"
            style={{ background: "#4f46e5" }}
          >
            CEH
          </div>

          <div>
            <div className="text-white font-bold text-lg leading-none">
              Campus Event Hub
            </div>

            <div className="text-slate-400 text-xs mt-0.5">
              Nền tảng sự kiện sinh viên
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative space-y-6">
          <div
            className="rounded-2xl overflow-hidden mb-8"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src="https://picsum.photos/seed/login/600/300"
              alt="Sinh viên tham gia sự kiện"
              className="w-full h-48 object-cover opacity-70"
            />

            <div
              className="px-4 py-3 text-xs"
              style={{ color: "#94a3b8" }}
            >
              Sinh viên Đại học Công nghệ Thông tin
            </div>
          </div>

          <div>
            <h1
              className="text-white font-bold leading-tight mb-4"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
              }}
            >
              Kết nối sinh viên
              <br />

              <span style={{ color: "#818cf8" }}>
                Khám phá sự kiện
              </span>

              <br />
              Tạo dấu ấn
            </h1>

            <p
              className="text-slate-400 leading-relaxed"
              style={{ fontSize: "0.9rem" }}
            >
              Đăng ký sự kiện, nhận vé QR và điểm danh — tất cả
              trên một nền tảng duy nhất dành cho sinh viên.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              ["1.284", "Lượt đăng ký"],
              ["12", "Sự kiện đang mở"],
              ["73,4%", "Tỷ lệ điểm danh"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="text-white font-bold text-xl">
                  {value}
                </div>

                <div
                  className="text-xs mt-0.5"
                  style={{ color: "#64748b" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p
          className="relative text-xs"
          style={{ color: "#334155" }}
        >
          © 2026 Campus Event Hub · Đại học Công nghệ Thông tin
        </p>
      </div>

      {/* ==================================================
          RIGHT FORM PANEL
      ================================================== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div
          className="w-full"
          style={{ maxWidth: 440 }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "#4f46e5" }}
            >
              CEH
            </div>

            <div>
              <div
                className="font-bold"
                style={{ color: "#1a1a2e" }}
              >
                Campus Event Hub
              </div>

              <div
                className="text-xs"
                style={{ color: "#94a3b8" }}
              >
                Nền tảng sự kiện sinh viên
              </div>
            </div>
          </div>

          {/* ==================================================
              AUTH CARD
          ================================================== */}
          <div
            className="bg-white rounded-2xl shadow-sm border p-8"
            style={{ borderColor: "#e2e8f0" }}
          >
            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl mb-6"
              style={{ background: "#f8fafc" }}
            >
              {["login", "register"].map((currentTab) => (
                <button
                  key={currentTab}
                  type="button"
                  onClick={() =>
                    handleChangeTab(currentTab)
                  }
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background:
                      tab === currentTab
                        ? "white"
                        : "transparent",

                    color:
                      tab === currentTab
                        ? "#1a1a2e"
                        : "#94a3b8",

                    boxShadow:
                      tab === currentTab
                        ? "0 1px 4px rgba(0,0,0,0.08)"
                        : "none",
                  }}
                >
                  {currentTab === "login"
                    ? "Đăng nhập"
                    : "Đăng ký"}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm border"
                style={{
                  background: "#fef2f2",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm border"
                style={{
                  background: "#f0fdf4",
                  borderColor: "#bbf7d0",
                  color: "#15803d",
                }}
              >
                {success}
              </div>
            )}

            {/* ==================================================
                LOGIN TAB
            ================================================== */}
            {tab === "login" ? (
              <>
                <h2 className="font-bold text-xl mb-1 text-slate-900">
                  Chào mừng trở lại
                </h2>

                <p className="text-sm mb-6 text-slate-400">
                  Đăng nhập để tiếp tục
                </p>

                <form
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <FormField
                    label="Email hoặc MSSV"
                    type="text"
                    placeholder="email@uit.edu.vn hoặc 2252xxxx"
                    value={identifier}
                    onChange={setIdentifier}
                    disabled={loading}
                    required
                  />

                  <FormField
                    label="Mật khẩu"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    disabled={loading}
                    required
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />

                      <span className="text-sm text-slate-600">
                        Ghi nhớ đăng nhập
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/forgot-password")
                      }
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                    Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 flex items-center justify-center rounded-xl font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Đang đăng nhập..."
                      : "Đăng nhập"}
                  </button>
                </form>
              </>
            ) : (
              /* ==================================================
                  REGISTER TAB
              ================================================== */
              <>
                <h2 className="font-bold text-xl mb-1 text-slate-900">
                  Tạo tài khoản mới
                </h2>

                <p className="text-sm mb-5 text-slate-400">
                  Điền thông tin sinh viên của bạn
                </p>

                <form
                  onSubmit={handleRegister}
                  className="space-y-3"
                >
                  <FormField
                    label="Họ và tên"
                    placeholder="Nguyễn Văn A"
                    value={registerForm.ho_ten}
                    onChange={(value) =>
                      updateRegisterField(
                        "ho_ten",
                        value
                      )
                    }
                    disabled={loading}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="MSSV"
                      placeholder="2252xxxx"
                      value={registerForm.mssv}
                      onChange={(value) =>
                        updateRegisterField(
                          "mssv",
                          value
                        )
                      }
                      disabled={loading}
                      required
                    />

                    <FormField
                      label="Số điện thoại"
                      placeholder="09xx xxx xxx"
                      value={registerForm.sdt}
                      onChange={(value) =>
                        updateRegisterField(
                          "sdt",
                          value
                        )
                      }
                      disabled={loading}
                    />
                  </div>

                  <FormField
                    label="Email sinh viên"
                    type="email"
                    placeholder="mssv@gm.uit.edu.vn"
                    value={registerForm.email}
                    onChange={(value) =>
                      updateRegisterField(
                        "email",
                        value
                      )
                    }
                    disabled={loading}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-600">
                      Khoa / Viện
                    </label>

                    <select
                      value={registerForm.khoa}
                      onChange={(e) =>
                        updateRegisterField(
                          "khoa",
                          e.target.value
                        )
                      }
                      disabled={loading}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-indigo-600 disabled:bg-slate-100"
                    >
                      <option value="Công nghệ Thông tin">
                        Công nghệ Thông tin
                      </option>

                      <option value="Khoa học Máy tính">
                        Khoa học Máy tính
                      </option>

                      <option value="Hệ thống Thông tin">
                        Hệ thống Thông tin
                      </option>

                      <option value="An toàn Thông tin">
                        An toàn Thông tin
                      </option>

                      <option value="Mạng máy tính & TT">
                        Mạng máy tính & TT
                      </option>
                    </select>
                  </div>

                  <FormField
                    label="Mật khẩu"
                    type="password"
                    placeholder="Tối thiểu 8 ký tự"
                    value={registerForm.mat_khau}
                    onChange={(value) =>
                      updateRegisterField(
                        "mat_khau",
                        value
                      )
                    }
                    disabled={loading}
                    required
                  />

                  <FormField
                    label="Xác nhận mật khẩu"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={
                      registerForm.xac_nhan_mat_khau
                    }
                    onChange={(value) =>
                      updateRegisterField(
                        "xac_nhan_mat_khau",
                        value
                      )
                    }
                    disabled={loading}
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-5 py-3 flex items-center justify-center rounded-xl font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Đang đăng ký..."
                      : "Đăng ký tài khoản"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// Reusable Form Field
// ==================================================
function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-slate-600">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange?.(e.target.value)
        }
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-indigo-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}