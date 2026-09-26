import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_EVENTS, getEventStatusLabel, getEventStatusColors, TOPIC_LABELS, TOPIC_COLORS } from '../mocks/mockData';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Giới thiệu');
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const event = MOCK_EVENTS.find(e => e.id === eventId);
  if (!event) return <div className="p-8 text-center">Không tìm thấy sự kiện</div>;

  const topicColor = TOPIC_COLORS[event.topic] || '#4f46e5';
  let ctaLabel = registered ? 'Xem vé của tôi' : event.status === 'full' ? 'Hết chỗ' : 'Đăng ký ngay';
  let ctaBg = registered ? '#eef2ff' : event.status === 'full' ? '#f1f5f9' : '#4f46e5';
  let ctaColor = registered ? '#4f46e5' : event.status === 'full' ? '#94a3b8' : 'white';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      <div className="relative h-64 flex items-center justify-center text-6xl"
        style={{ background: `linear-gradient(135deg, ${topicColor}ee, ${topicColor}99)` }}>
        🎓
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 bg-black/20 text-white rounded-full flex items-center justify-center">
          ←
        </button>
        <div className="absolute bottom-4 left-4 text-white">
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold mb-2 inline-block">{TOPIC_LABELS[event.topic]}</span>
          <h1 className="font-bold text-2xl">{event.title}</h1>
        </div>
      </div>

      <div className="bg-white p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-b">
        <div><p className="text-xl">📅</p><p className="text-sm font-semibold">{new Date(event.date).toLocaleDateString('vi-VN')}</p></div>
        <div><p className="text-xl">🕐</p><p className="text-sm font-semibold">{event.startTime}</p></div>
        <div><p className="text-xl">📍</p><p className="text-sm font-semibold">{event.room}</p></div>
        <div><p className="text-xl">👥</p><p className="text-sm font-semibold">{event.registered}/{event.capacity}</p></div>
      </div>

      <div className="flex border-b bg-white overflow-x-auto">
        {['Giới thiệu', 'Lịch trình', 'Diễn giả'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-screen-xl mx-auto w-full">
        {tab === 'Giới thiệu' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h2 className="font-bold mb-2">Mô tả sự kiện</h2>
            <p className="text-slate-600 text-sm">{event.description}</p>
          </div>
        )}
        {tab === 'Lịch trình' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm text-sm text-slate-600">
            <p>08:00 - Khai mạc</p>
            <p>09:00 - Trình bày</p>
            <p>10:30 - Hỏi đáp</p>
          </div>
        )}
        {tab === 'Diễn giả' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full text-white flex items-center justify-center font-bold text-xl" style={{ background: topicColor }}>
              {event.speaker.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold">{event.speaker}</h3>
              <p className="text-sm text-slate-500">Chuyên gia {TOPIC_LABELS[event.topic]}</p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button onClick={() => { if (!registered && event.status !== 'full') { setRegistering(true); setTimeout(() => { setRegistering(false); setRegistered(true); }, 1000); } }}
          className="w-full py-3.5 rounded-xl font-bold"
          style={{ background: ctaBg, color: ctaColor }}>
          {registering ? 'Đang xử lý...' : ctaLabel}
        </button>
      </div>
    </div>
  );
}