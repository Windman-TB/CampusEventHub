import { NavLink } from 'react-router-dom';

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in pb-20" style={{ background: '#f4f5f9' }}>
      <main className="flex-1 w-full max-w-screen-xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 pb-safe" style={{ borderColor: '#f1f5f9' }}>
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 w-16 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold">Khám phá</span>
          </NavLink>
          <NavLink to="/tickets" className={({ isActive }) => `flex flex-col items-center gap-1 w-16 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-xl">🎟️</span>
            <span className="text-[10px] font-semibold">Vé của tôi</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 w-16 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-semibold">Cá nhân</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
