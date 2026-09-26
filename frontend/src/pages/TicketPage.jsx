import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { MOCK_EVENTS } from '../mocks/mockData'; // Sử dụng mock data dùng chung

export default function TicketPage() {
  const [tab, setTab] = useState('upcoming');
  const [showQR, setShowQR] = useState(null);

  // Giả lập vé (Lấy sự kiện đầu tiên làm vé đã đăng ký)
  const myTickets = [
    { id: 'TKT-2026-123', event: MOCK_EVENTS[0], status: 'pending' },
    { id: 'TKT-2026-045', event: MOCK_EVENTS[1], status: 'attended' }
  ];
  
  const list = tab === 'upcoming' ? myTickets.filter(t => t.status === 'pending') : myTickets.filter(t => t.status !== 'pending');

  return (
    <MainLayout>
      <div className="bg-white px-4 pt-6 pb-0 shadow-sm">
        <h1 className="font-bold text-xl mb-4 text-slate-900">Vé của tôi</h1>
        <div className="flex border-b border-slate-100">
          <button onClick={() => setTab('upcoming')} className={`flex-1 pb-3 text-sm font-semibold border-b-2 ${tab === 'upcoming' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Sắp diễn ra</button>
          <button onClick={() => setTab('history')} className={`flex-1 pb-3 text-sm font-semibold border-b-2 ${tab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Lịch sử</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {list.map(ticket => (
          <div key={ticket.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-900">{ticket.event.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${ticket.status === 'pending' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                {ticket.status === 'pending' ? 'Chưa check-in' : 'Đã tham dự'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">📅 {new Date(ticket.event.date).toLocaleDateString('vi-VN')} · 📍 {ticket.event.room}</p>
            
            {ticket.status === 'pending' && (
              <button onClick={() => setShowQR(ticket)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
                Hiện mã QR
              </button>
            )}
          </div>
        ))}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQR(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-1 text-slate-900">Mã QR của bạn</h2>
            <p className="text-xs text-slate-500 mb-6">{showQR.event.title}</p>
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl border-2 border-slate-200 flex items-center justify-center text-6xl">
              🔳
            </div>
            <p className="font-mono font-bold mt-4 mb-6">{showQR.id}</p>
            <button onClick={() => setShowQR(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold">Đóng</button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}