import { NavLink } from 'react-router-dom';

/**
 * BottomNav — Bottom navigation bar shared across student & staff pages.
 * @param {boolean} showCheckin - Show the "Điểm danh" tab (for CTV staff).
 * @param {string}  activeBg    - Override active color (default indigo-600).
 */
export function BottomNav({ showCheckin = false, dark = false }) {
  const activeCls = dark ? 'text-indigo-400' : 'text-indigo-600';
  const inactiveCls = dark ? 'text-slate-500' : 'text-slate-400';
  const cls = (isActive) => `flex flex-col items-center gap-1 w-16 ${isActive ? activeCls : inactiveCls}`;
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

        {showCheckin && (
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
 * MainLayout — wraps student pages with BottomNav (no check-in tab by default).
 * Pass showCheckin={true} for staff CTV pages.
 */
export default function MainLayout({ children, showCheckin = false }) {
  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in pb-20"
      style={{ background: '#f4f5f9' }}
    >
      <main className="flex-1 w-full max-w-screen-xl mx-auto">
        {children}
      </main>
      <BottomNav showCheckin={showCheckin} />
    </div>
  );
}
