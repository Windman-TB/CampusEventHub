import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { MOCK_EVENTS, getEventStatusLabel, getEventStatusColors } from '../mocks/mockData';

export default function EventManagementPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredEvents = MOCK_EVENTS.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
              Quản lý sự kiện
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Quản lý và tổ chức các sự kiện của bạn</p>
          </div>
          <button onClick={() => navigate('/dashboard/events/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: '#4f46e5' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tạo sự kiện mới
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm sự kiện..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none bg-white transition-colors"
              style={{ borderColor: '#e2e8f0' }} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {['all', 'open', 'nearly_full', 'full', 'ended'].map(status => (
              <button key={status} onClick={() => setFilter(status)}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  background: filter === status ? '#1e293b' : 'white',
                  color: filter === status ? 'white' : '#475569',
                  border: `1px solid ${filter === status ? '#1e293b' : '#e2e8f0'}`
                }}>
                {status === 'all' ? 'Tất cả' : getEventStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#f1f5f9' }}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Sự kiện</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Thời gian</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Đăng ký</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Trạng thái</th>
                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: '#64748b' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: '#f1f5f9' }}>
              {filteredEvents.map(event => {
                const sc = getEventStatusColors(event.status);
                const pct = Math.round((event.registered / event.capacity) * 100);
                return (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-base mb-1" style={{ color: '#1a1a2e', fontFamily: 'var(--font-display)' }}>{event.title}</div>
                      <div className="text-xs" style={{ color: '#64748b' }}>📍 {event.room}, {event.location}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium" style={{ color: '#475569' }}>{new Date(event.date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{event.startTime} - {event.endTime}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>
                          {event.registered}/{event.capacity}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#059669' }}>
                          ({pct}%)
                        </span>
                      </div>
                      <div className="w-24 h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#dc2626' : '#059669' }} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{ background: sc.bg, color: sc.text }}>
                        {getEventStatusLabel(event.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Chỉnh sửa">
                        <svg className="w-4 h-4" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {filteredEvents.map(event => {
            const sc = getEventStatusColors(event.status);
            const pct = Math.round((event.registered / event.capacity) * 100);
            return (
              <div key={event.id} className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                    {getEventStatusLabel(event.status)}
                  </span>
                  <button className="p-1.5 rounded-lg hover:bg-slate-50">
                    <svg className="w-4 h-4" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                  {event.title}
                </h3>
                <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                  {new Date(event.date).toLocaleDateString('vi-VN')} · {event.startTime} - {event.endTime}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: '#f1f5f9' }}>
                  <div className="text-xs" style={{ color: '#64748b' }}>
                    <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>{event.registered}</span>
                    /{event.capacity} đăng ký
                  </div>
                  <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#059669' }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
