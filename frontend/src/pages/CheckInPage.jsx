import { useState } from 'react';
import { MOCK_EVENTS } from '../mocks/mockData';

export default function CheckInPage() {
  const [manualCode, setManualCode] = useState('');
  const [history, setHistory] = useState([]);

  function handleCheckIn() {
    if (!manualCode) return;
    setHistory([{ code: manualCode, time: new Date().toLocaleTimeString('vi-VN') }, ...history]);
    setManualCode('');
    alert('Điểm danh thành công!');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="font-bold text-xl">Điểm danh</h1>
          <p className="text-xs text-slate-400">Campus Event Hub</p>
        </div>
        <button className="px-4 py-2 bg-white/10 rounded-xl text-sm font-medium">Thoát</button>
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-400 mb-2">Sự kiện hiện tại</p>
        <select className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 outline-none font-medium appearance-none">
          {MOCK_EVENTS.map(e => <option key={e.id} value={e.id} className="text-black">{e.title}</option>)}
        </select>
      </div>

      <div className="aspect-square bg-slate-800 rounded-3xl border-2 border-white/10 flex items-center justify-center mb-6 relative overflow-hidden">
        <div className="absolute inset-0 border-4 border-indigo-500/50 m-8 rounded-2xl border-dashed opacity-50"></div>
        <p className="text-slate-400 z-10 font-medium">Camera đang bật...</p>
      </div>

      <div className="mb-8 flex gap-2">
        <input 
          value={manualCode} 
          onChange={e => setManualCode(e.target.value)}
          placeholder="Nhập mã vé thủ công (TKT-xxx)" 
          className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 outline-none font-mono text-sm"
        />
        <button onClick={handleCheckIn} className="px-6 bg-indigo-600 rounded-2xl font-bold">Xác nhận</button>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Lịch sử gần đây</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="font-mono text-sm text-emerald-400">{h.code}</span>
                <span className="text-sm text-slate-400">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}