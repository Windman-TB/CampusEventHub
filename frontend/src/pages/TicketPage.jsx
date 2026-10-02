import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketPage() {
  const [tab, setTab] = useState('upcoming');
  const [showQR, setShowQR] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/tickets/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    // Tạm tắt window.confirm để debug lỗi bấm Hủy vé không có phản hồi
    // if (!window.confirm('Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.')) return;
    
    setCancelingId(ticketId);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/tickets/${ticketId}/cancel`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Hủy vé thành công!');
        fetchTickets(); // Load lại danh sách vé
      } else {
        alert('Lỗi từ Server: ' + (data.message || 'Hủy vé thất bại'));
      }
    } catch (err) {
      alert('Không thể kết nối đến server để hủy vé: ' + err.message);
    } finally {
      setCancelingId(null);
    }
  };

  // Phân loại vé: 'upcoming' = Đã đăng ký (DaDangKy), 'history' = Đã tham dự (DaCheckIn) hoặc Đã hủy (DaHuy)
  const list = tab === 'upcoming' 
    ? tickets.filter(t => t.trang_thai_ve === 'DaDangKy') 
    : tickets.filter(t => t.trang_thai_ve !== 'DaDangKy');

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
        {loading ? (
          <p className="text-center text-sm text-gray-500 mt-4">Đang tải danh sách vé...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-sm text-gray-500 mt-4">Không có vé nào trong mục này.</p>
        ) : (
          list.map(ticket => (
            <div key={ticket.ma_dang_ky} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900">{ticket.su_kien?.ten_su_kien}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold 
                  ${ticket.trang_thai_ve === 'DaDangKy' ? 'bg-indigo-50 text-indigo-600' 
                    : ticket.trang_thai_ve === 'DaCheckIn' ? 'bg-green-50 text-green-600' 
                    : 'bg-red-50 text-red-600'}`}>
                  {ticket.trang_thai_ve === 'DaDangKy' ? 'Chưa check-in' 
                    : ticket.trang_thai_ve === 'DaCheckIn' ? 'Đã tham dự' 
                    : 'Đã hủy'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">📅 {new Date(ticket.su_kien?.ngay_dien_ra).toLocaleDateString('vi-VN')} · 📍 {ticket.su_kien?.phong} - {ticket.su_kien?.dia_diem}</p>
              
              {ticket.trang_thai_ve === 'DaDangKy' && (
                <div className="flex gap-2">
                  <button onClick={() => setShowQR(ticket)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                    Hiện mã QR
                  </button>
                  <button 
                    onClick={() => handleCancelTicket(ticket.ma_dang_ky)} 
                    disabled={cancelingId === ticket.ma_dang_ky}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                  >
                    {cancelingId === ticket.ma_dang_ky ? 'Đang hủy...' : 'Hủy vé'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQR(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-1 text-slate-900">Mã QR của bạn</h2>
            <p className="text-xs text-slate-500 mb-6">{showQR.su_kien?.ten_su_kien}</p>
            <div className="p-4 mx-auto bg-white rounded-2xl border-2 border-slate-200 inline-block mb-4">
              <QRCodeSVG value={showQR.ma_qr_code} size={200} />
            </div>
            <p className="font-mono text-xs text-gray-400 mt-2 mb-6 break-all px-4">{showQR.ma_qr_code}</p>
            <button onClick={() => setShowQR(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold hover:bg-slate-200">Đóng</button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}