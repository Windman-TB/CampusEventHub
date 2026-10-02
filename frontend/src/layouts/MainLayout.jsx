import { NavLink } from "react-router-dom";
import { getStoredRole } from "../utils/authStorage";

/**
 * BottomNav — Bottom navigation bar shared across all student/staff pages.
 * Tự động đọc role từ localStorage để quyết định có hiện tab "Điểm danh" không.
 * - dark: true khi dùng trên nền tối (CheckInPage)
 */
export function BottomNav({ showCheckin, dark = false }) {
  const isStaff =
  showCheckin !== undefined
    ? Boolean(showCheckin)
    : getStoredRole() === "NhanVienCheckIn";

  const activeCls = dark ? 'text-indigo-400' : 'text-indigo-600';
  const inactiveCls = dark ? 'text-slate-500' : 'text-slate-400';
  const cls = (isActive) => `flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? activeCls : inactiveCls}`;
  const navBg = dark ? '#0f0f1a' : 'white';
  const navBorder = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t z-50 pb-safe"
      style={{ background: navBg, borderColor: navBorder }}
    >
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        <NavLink to="/home" end className={({ isActive }) => cls(isActive)}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-semibold">Khám phá</span>
        </NavLink>

        <NavLink to="/tickets" className={({ isActive }) => cls(isActive)}>
          <span className="text-xl">🎟️</span>
          <span className="text-[10px] font-semibold">Vé của tôi</span>
        </NavLink>

        {/* Tab Điểm danh chỉ hiện nếu là staff CTV */}
        {isStaff && (
          <NavLink to="/check-in" className={({ isActive }) => cls(isActive)}>
            <span className="text-xl">📷</span>
            <span className="text-[10px] font-semibold">Điểm danh</span>
          </NavLink>
        )}

        <NavLink to="/profile" className={({ isActive }) => cls(isActive)}>
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-semibold">Cá nhân</span>
        </NavLink>
      </div>
    </div>
  );
}

/**
 * MainLayout — wraps student pages with BottomNav.
 * BottomNav tự detect role từ localStorage, không cần truyền prop.
 */
export default function MainLayout({ children }) {
  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in pb-20"
      style={{ background: '#f4f5f9' }}
    >
      <main className="flex-1 w-full max-w-screen-xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

