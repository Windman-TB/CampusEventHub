import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_EVENTS, getEventStatusLabel, getEventStatusColors, TOPIC_LABELS, TOPIC_COLORS } from '../mocks/mockData';

const TOPIC_LIST = Object.keys(TOPIC_LABELS);

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const navigate = useNavigate();

  const filtered = MOCK_EVENTS.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.speaker.toLowerCase().includes(search.toLowerCase());
    const matchTopic = topic === 'all' || e.topic === topic;
    return matchSearch && matchTopic;
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f4f5f9' }}>
      <div className="bg-white sticky top-0 z-10 shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-3 max-w-screen-xl mx-auto">
          <div>
            <p className="text-sm font-medium" style={{ color: '#64748b' }}>Xin chào 👋</p>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
              Khám phá sự kiện
            </h1>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-10 h-10 bg-indigo-600 text-white rounded-full font-bold">
            SV
          </button>
        </div>
        <div className="max-w-screen-xl mx-auto mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm sự kiện, diễn giả..."
            className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-screen-xl mx-auto">
          <button onClick={() => setTopic('all')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${topic === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            Tất cả
          </button>
          {TOPIC_LIST.map(t => (
            <button key={t} onClick={() => setTopic(topic === t ? 'all' : t)}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{ background: topic === t ? TOPIC_COLORS[t] : '#f1f5f9', color: topic === t ? 'white' : '#64748b' }}>
              {TOPIC_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-screen-xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(event => {
            const sc = getEventStatusColors(event.status);
            const pct = Math.round((event.registered / event.capacity) * 100);
            return (
              <div key={event.id} onClick={() => navigate(`/events/${event.id}`)}
                className="bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-all">
                <div className="h-32 flex items-center justify-center text-4xl relative"
                  style={{ background: `linear-gradient(135deg, ${TOPIC_COLORS[event.topic]}dd, ${TOPIC_COLORS[event.topic]}99)` }}>
                  🎓
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                    {getEventStatusLabel(event.status)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1" style={{ color: '#1a1a2e' }}>{event.title}</h3>
                  <p className="text-xs text-slate-500 mb-2">📅 {new Date(event.date).toLocaleDateString('vi-VN')} · {event.startTime}</p>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{event.registered}/{event.capacity} chỗ</span>
                    <span style={{ color: pct > 90 ? 'red' : 'indigo' }}>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 90 ? 'red' : 'indigo' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}