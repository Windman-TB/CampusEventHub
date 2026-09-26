import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { MOCK_EVENTS, MOCK_PARTICIPANTS, getEventStatusLabel } from '../mocks/mockData';

const TICKET_STATUS = {
  attended: { bg: '#dcfce7', text: '#15803d', label: 'Đã điểm danh' },
  pending: { bg: '#fef9c3', text: '#a16207', label: 'Chưa điểm danh' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c', label: 'Đã hủy' },
};

export default function ParticipantsPage() {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [search, setSearch] = useState('');

  const selectedEvent = MOCK_EVENTS.find(e => e.id === selectedEventId);
  const participants = MOCK_PARTICIPANTS.filter(p => p.eventId === selectedEventId);
  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mssv.includes(search)
  );
  const attended = participants.filter(p => p.status === 'attended').length;
  const total = participants.filter(p => p.status !== 'cancelled').length;

  if (!selectedEventId) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-screen-xl">
          <div className="mb-6">
            <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
              Người tham gia
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Chọn sự kiện để xem danh sách người tham gia</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MOCK_EVENTS.map(event => {
              const evPart = MOCK_PARTICIPANTS.filter(p => p.eventId === event.id);
              const evAttended = evPart.filter(p => p.status === 'attended').length;
              const evTotal = evPart.filter(p => p.status !== 'cancelled').length;
              return (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover-scale"
                  style={{ borderColor: '#f1f5f9' }}>
                  <div className="relative h-28 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)' }}>
                    <span className="text-white text-2xl">🎓</span>
                    <div className="absolute bottom-2 left-3 right-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>
                        {getEventStatusLabel(event.status)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm leading-snug mb-1" style={{ color: '#1a1a2e' }}>{event.title}</h3>
                    <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                      {new Date(event.date).toLocaleDateString('vi-VN')} · {event.room}
                    </p>
                    <div className="flex justify-between text-xs mb-3">
                      <span style={{ color: '#64748b' }}>{evTotal} đăng ký</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>{evAttended} điểm danh</span>
                    </div>
                    <button onClick={() => setSelectedEventId(event.id)}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: '#4f46e5' }}>Xem danh sách</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        <button onClick={() => setSelectedEventId(null)} className="mb-4 text-sm font-medium" style={{ color: '#475569' }}>
          ← Quay lại
        </button>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ color: '#1a1a2e' }}>{selectedEvent?.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{total} đăng ký · {attended} điểm danh</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm MSSV, tên..."
            className="px-4 py-2 border rounded-xl text-sm" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#f1f5f9' }}>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs">MSSV</th>
                <th className="px-4 py-3 font-semibold text-xs">Họ tên</th>
                <th className="px-4 py-3 font-semibold text-xs">Khoa</th>
                <th className="px-4 py-3 font-semibold text-xs">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const ts = TICKET_STATUS[p.status];
                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.mssv}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.faculty}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: ts.bg, color: ts.text }}>
                        {ts.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
