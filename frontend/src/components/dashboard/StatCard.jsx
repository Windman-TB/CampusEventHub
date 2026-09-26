export default function StatCard({ icon, label, value, change, changePositive, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border animate-fade-in" style={{ borderColor: '#f1f5f9' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {icon}
          </svg>
        </div>
      </div>
      <div className="font-bold text-2xl lg:text-3xl mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
        {value}
      </div>
      <div className="text-sm font-medium mb-2 leading-snug" style={{ color: '#475569' }}>{label}</div>
      {change && (
        <div className="text-xs font-medium" style={{ color: changePositive ? '#059669' : '#dc2626' }}>
          {changePositive ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}
