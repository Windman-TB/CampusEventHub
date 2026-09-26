import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { CHART_BAR_DATA, CHART_PIE_DATA, CHART_LINE_DATA } from '../../mocks/mockData';

const PIE_COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#059669', '#d97706'];

export default function DashboardChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 lg:p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
        <h2 className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
          Đăng ký và điểm danh theo sự kiện
        </h2>
        <p className="text-xs mb-5" style={{ color: '#94a3b8' }}>Số lượng sinh viên thực tế</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={CHART_BAR_DATA} barCategoryGap="35%" margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="event" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={v => v === 'registered' ? 'Đăng ký' : 'Điểm danh'} />
            <Bar dataKey="registered" name="registered" fill="#4f46e5" radius={[3, 3, 0, 0]} />
            <Bar dataKey="checkin" name="checkin" fill="#0891b2" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
        <h2 className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
          Phân bổ theo khoa
        </h2>
        <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>% tham gia sự kiện</p>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={CHART_PIE_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={3} dataKey="value">
              {CHART_PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} formatter={v => [`${v}%`]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-1">
          {CHART_PIE_DATA.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-xs truncate" style={{ color: '#475569', maxWidth: 120 }}>{d.name}</span>
              </div>
              <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-2xl p-5 lg:p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
        <h2 className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
          Xu hướng đăng ký theo thời gian
        </h2>
        <p className="text-xs mb-5" style={{ color: '#94a3b8' }}>Lượt đăng ký theo tháng trong năm học 2025–2026</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={CHART_LINE_DATA} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={v => [`${v} lượt`, 'Đăng ký']} />
            <Line type="monotone" dataKey="registrations" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6, fill: '#4f46e5' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
