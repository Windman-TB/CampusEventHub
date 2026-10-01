import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setStoredRole } from "../layouts/MainLayout";
import { apiFetch } from "../services/api";

const DEMO_ACCOUNTS = [
  {
    role: "student",
    label: "Sinh viên",
    bg: "#eef2ff",
    color: "#4f46e5",
    desc: "Khám phá và đăng ký sự kiện",
    path: "/home",
  },
  {
    role: "organizer",
    label: "Ban tổ chức",
    bg: "#ecfeff",
    color: "#0891b2",
    desc: "Quản lý sự kiện và báo cáo",
    path: "/dashboard",
  },
  {
    role: "staff",
    label: "Sinh viên (CTV điểm danh)",
    bg: "#ecfdf5",
    color: "#059669",
    desc: "Đã được cấp quyền điểm danh",
    badge: "Có quyền điểm danh",
    path: "/check-in",
  },
];

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return alert("Vui lòng nhập email và mật khẩu");

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: email, mat_khau: password }),
      });

      if (res.data?.accessToken) {
        sessionStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("token", res.data.accessToken);
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        const role = res.data.user?.loai_tai_khoan;
        if (role === "ToChuc") {
          setStoredRole("organizer");
          navigate("/dashboard");
        } else if (role === "NhanVienCheckIn") {
          setStoredRole("staff");
          navigate("/check-in");
        } else {
          setStoredRole("student");
          navigate("/home");
        }
      }
    } catch (err) {
      alert(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(acc) {
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({ role: acc.role }),
      });

      if (res.data?.accessToken) {
        sessionStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("token", res.data.accessToken);
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      }
      setStoredRole(acc.role);
      navigate(acc.path);
    } catch (err) {
      console.error("Demo login error:", err);
      setStoredRole(acc.role);
      navigate(acc.path);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Left branding panel — desktop only */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{ width: "52%", background: "#1a1a2e" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: "#4f46e5", filter: "blur(80px)" }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10"
            style={{ background: "#0891b2", filter: "blur(80px)" }}
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
            <div className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>
              Sinh viên Đại học Công nghệ Thông tin
            </div>
          </div>

          <div>
            <h1
              className="text-white font-bold leading-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              Kết nối sinh viên
              <br />
              <span style={{ color: "#818cf8" }}>Khám phá sự kiện</span>
              <br />
              Tạo dấu ấn
            </h1>
            <p
              className="text-slate-400 leading-relaxed"
              style={{ fontSize: "0.9rem" }}
            >
              Đăng ký sự kiện, nhận vé QR và điểm danh — tất cả trên một nền
              tảng duy nhất dành cho sinh viên.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              ["1.284", "Lượt đăng ký"],
              ["12", "Sự kiện đang mở"],
              ["73,4%", "Tỷ lệ điểm danh"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="text-white font-bold text-xl">{v}</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: "#334155" }}>
          © 2026 Campus Event Hub · Đại học Công nghệ Thông tin
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full" style={{ maxWidth: 440 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "#4f46e5" }}
            >
              CEH
            </div>
            <div>
              <div className="font-bold" style={{ color: "#1a1a2e" }}>
                Campus Event Hub
              </div>
              <div className="text-xs" style={{ color: "#94a3b8" }}>
                Nền tảng sự kiện sinh viên
              </div>
            </div>
          </div>

          {/* Auth card */}
          <div
            className="bg-white rounded-2xl shadow-sm border p-8"
            style={{ borderColor: "#e2e8f0" }}
          >
            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl mb-6"
              style={{ background: "#f8fafc" }}
            >
              {["login", "register"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: tab === t ? "white" : "transparent",
                    color: tab === t ? "#1a1a2e" : "#94a3b8",
                    boxShadow:
                      tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {t === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            {tab === "login" ? (
              <>
                <h2 className="font-bold text-xl mb-1 text-slate-900">
                  Chào mừng trở lại
                </h2>
                <p className="text-sm mb-6 text-slate-400">Đăng nhập để tiếp tục</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    label="Email hoặc MSSV"
                    type="text"
                    placeholder="email@uit.edu.vn hoặc 2252xxxx"
                    value={email}
                    onChange={setEmail}
                  />
                  <FormField
                    label="Mật khẩu"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
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
                      className="text-sm font-medium text-indigo-600"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 flex items-center justify-center rounded-xl font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
                  >
                    {loading ? "Đang xử lý..." : "Đăng nhập"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="font-bold text-xl mb-1 text-slate-900">
                  Tạo tài khoản mới
                </h2>
                <p className="text-sm mb-5 text-slate-400">
                  Điền thông tin sinh viên của bạn
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <FormField label="Họ và tên" placeholder="Nguyễn Văn A" />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="MSSV" placeholder="2252xxxx" />
                    <FormField label="Số điện thoại" placeholder="09xx xxx xxx" />
                  </div>
                  <FormField
                    label="Email sinh viên"
                    type="email"
                    placeholder="mssv@gm.uit.edu.vn"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-600">
                      Khoa / Viện
                    </label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-indigo-600"
                    >
                      <option>Công nghệ Thông tin</option>
                      <option>Khoa học Máy tính</option>
                      <option>Hệ thống Thông tin</option>
                      <option>An toàn Thông tin</option>
                      <option>Mạng máy tính & TT</option>
                    </select>
                  </div>
                  <FormField
                    label="Mật khẩu"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <FormField
                    label="Xác nhận mật khẩu"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-5 py-3 flex items-center justify-center rounded-xl font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
                  >
                    {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Demo accounts */}
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                Đăng nhập nhanh bằng Demo
              </span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
            
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDemoLogin(acc)}
                  disabled={loading}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 text-left transition-all hover:shadow-sm bg-white"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: acc.bg }}
                  >
                    <span className="text-xs font-bold" style={{ color: acc.color }}>
                      {acc.role === "organizer" ? "BTC" : "SV"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {acc.label}
                      </span>
                      {acc.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: acc.bg, color: acc.color }}
                        >
                          {acc.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 text-slate-400">
                      {acc.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-slate-600">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-indigo-600"
      />
    </div>
  );
}
