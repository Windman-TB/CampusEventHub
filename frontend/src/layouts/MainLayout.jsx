import { NavLink } from 'react-router-dom';
import { Home, Ticket, QrCode, User } from 'lucide-react';

export const getStoredRole = () => localStorage.getItem('app_role') || 'student';
export const setStoredRole = (role) => localStorage.setItem('app_role', role);
export const clearStoredRole = () => localStorage.removeItem('app_role');

export function BottomNav() {
  const activeCls = 'text-indigo-600';
  const inactiveCls = 'text-slate-400 hover:text-slate-600';
  const cls = (isActive) => `flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? activeCls : inactiveCls}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex justify-around items-center h-[60px] max-w-screen-xl mx-auto px-2">
        <NavLink to="/home" className={({ isActive }) => cls(isActive)}>
          <Home size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Trang chủ</span>
        </NavLink>

        <NavLink to="/tickets" className={({ isActive }) => cls(isActive)}>
          <Ticket size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Vé của tôi</span>
        </NavLink>

        <NavLink to="/check-in" className={({ isActive }) => cls(isActive)}>
          <QrCode size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Điểm danh</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => cls(isActive)}>
          <User size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Hồ sơ</span>
        </NavLink>
      </div>
    </div>
  );
}

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-20">
      <main className="flex-1 w-full max-w-screen-xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
