import { NavLink } from "react-router-dom";
import { Home, LayoutDashboard, Ticket, QrCode, User } from "lucide-react";
import { getStoredRole } from "../utils/authStorage";

/**
 * Thanh điều hướng dưới cùng cho các vai trò trong Campus Event Hub.
 *
 * - SinhVien: Trang chủ, Vé của tôi, Hồ sơ.
 * - NhanVienCheckIn: Trang chủ, Vé của tôi, Điểm danh, Hồ sơ.
 * - ToChuc: Tổng quan, Hồ sơ (và Điểm danh khi showCheckin=true).
 *
 * showCheckin: nếu được truyền, ưu tiên giá trị này khi hiển thị mục Điểm danh.
 * dark: dùng giao diện tối trên trang CheckInPage.
 *
 * Các hàm quản lý vai trò được import trực tiếp từ authStorage.js;
 * không re-export tại đây để đáp ứng react-refresh/only-export-components.
 */
export function BottomNav({ showCheckin, dark = false }) {
  const role = getStoredRole();
  const isStudentOrStaff =
    role === "SinhVien" || role === "NhanVienCheckIn";
  const isOrganizer = role === "ToChuc";

  const canShowCheckin =
    showCheckin !== undefined
      ? Boolean(showCheckin)
      : role === "NhanVienCheckIn";

  const activeClass = dark ? "text-indigo-400" : "text-indigo-600";
  const inactiveClass = dark
    ? "text-slate-500 hover:text-slate-300"
    : "text-slate-400 hover:text-slate-600";

  const getLinkClass = ({ isActive }) =>
    [
      "flex flex-col items-center justify-center gap-1 w-16",
      "transition-colors focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg",
      isActive ? activeClass : inactiveClass,
    ].join(" ");

  return (
    <nav
      aria-label="Điều hướng chính"
      className={`fixed bottom-0 left-0 right-0 z-50 border-t pb-safe ${
        dark
          ? "bg-[#0f0f1a] border-white/10"
          : "bg-white border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
      }`}
    >
      <div className="flex h-[60px] max-w-screen-xl mx-auto items-center justify-around px-2">
        {isStudentOrStaff && (
          <NavLink to="/home" end className={getLinkClass}>
            <Home size={22} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[10px] font-semibold">Trang chủ</span>
          </NavLink>
        )}

        {isOrganizer && (
          <NavLink to="/dashboard" className={getLinkClass}>
            <LayoutDashboard size={22} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[10px] font-semibold">Tổng quan</span>
          </NavLink>
        )}

        {isStudentOrStaff && (
          <NavLink to="/tickets" className={getLinkClass}>
            <Ticket size={22} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[10px] font-semibold">Vé của tôi</span>
          </NavLink>
        )}

        {canShowCheckin && (
          <NavLink to="/check-in" className={getLinkClass}>
            <QrCode size={22} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[10px] font-semibold">Điểm danh</span>
          </NavLink>
        )}

        <NavLink to="/profile" className={getLinkClass}>
          <User size={22} strokeWidth={2.5} aria-hidden="true" />
          <span className="text-[10px] font-semibold">Hồ sơ</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20 font-sans animate-fade-in">
      <main className="mx-auto w-full max-w-screen-xl flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
