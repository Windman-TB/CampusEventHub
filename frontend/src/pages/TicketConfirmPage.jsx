import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MOCK_EVENTS } from '../mocks/mockData';

/**
 * TicketConfirmPage
 * Hiển thị sau khi sinh viên đăng ký sự kiện thành công.
 * Nhận state từ navigation: { ticketId, eventId }
 * Fallback về MOCK_EVENTS[0] nếu không có state (truy cập trực tiếp URL).
 */
export default function TicketConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy thông tin từ navigation state hoặc dùng mock fallback
  const {
    ticketId = 'TKT-2026-001234',
    eventId = '1',
    studentName = 'Nguyễn Văn A',
    studentId = '22521001',
    faculty = 'Công nghệ Thông tin',
  } = location.state || {};

  const event = MOCK_EVENTS.find((e) => e.id === eventId) || MOCK_EVENTS[0];

  // QR value: format đủ thông tin để staff scanner đọc được
  const qrValue = `${ticketId}|${event.id}|${studentId}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center animate-fade-in"
      style={{ background: '#f4f5f9' }}
    >
      {/* Top spacing */}
      <div className="w-full shrink-0 h-10" />

      <div className="flex flex-col items-center px-4 py-6 w-full max-w-md mx-auto">

        {/* Success icon + heading */}
        <div className="mt-6 mb-6 flex flex-col items-center hover-scale">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-md"
            style={{ background: '#dcfce7' }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: '#059669' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl text-center" style={{ color: '#1a1a2e' }}>
            Đăng ký giữ chỗ thành công!
          </h1>
          <p className="text-center text-sm mt-2" style={{ color: '#64748b' }}>
            Mã vé đã được tạo và lưu vào hồ sơ của bạn
          </p>
        </div>

        {/* Ticket card */}
        <div className="glass rounded-3xl overflow-hidden w-full hover-scale">

          {/* Top gradient band */}
          <div
            className="px-6 py-4"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#c7d2fe' }}>
              SỰ KIỆN
            </p>
            <h2 className="text-white font-bold text-base leading-tight">
              {event.title}
            </h2>
          </div>

          {/* Ticket details */}
          <div className="px-6 py-4 space-y-3 bg-white">
            <TicketRow emoji="📅" label="Thời gian"
              value={`${new Date(event.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${event.startTime} – ${event.endTime}`}
            />
            <TicketRow emoji="📍" label="Địa điểm" value={`${event.location} — ${event.room}`} />
            <TicketRow emoji="🎓" label="Sinh viên" value={`${studentName} · ${studentId}`} />
            <TicketRow emoji="🏛️" label="Khoa" value={faculty} />
          </div>

          {/* Dashed separator */}
          <div className="flex items-center px-6 bg-white">
            <div className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
            <div className="w-4 h-4 rounded-full mx-2 flex-shrink-0" style={{ background: '#f4f5f9' }} />
            <div className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
          </div>

          {/* QR Code section */}
          <div className="px-6 py-6 flex flex-col items-center bg-white rounded-b-3xl">
            <div
              className="w-48 h-48 rounded-2xl flex items-center justify-center mb-3 bg-white shadow-sm"
              style={{ border: '1px solid rgba(0,0,0,0.06)', padding: '12px' }}
            >
              <QRCodeSVG
                value={qrValue}
                size={168}
                level="M"
                fgColor="#1a1a2e"
                bgColor="transparent"
              />
            </div>
            <p
              className="font-mono font-bold text-sm tracking-wider"
              style={{ color: '#1a1a2e', fontFamily: 'var(--font-mono)' }}
            >
              {ticketId}
            </p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Xuất trình mã này khi check-in
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3 mt-8">
          <button
            onClick={() => navigate('/tickets')}
            className="btn-primary w-full py-3.5 rounded-2xl font-semibold text-sm"
          >
            Xem trong Vé của tôi
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-sm font-medium hover-scale"
            style={{ color: '#64748b' }}
          >
            Quay về trang chủ
          </button>
        </div>

      </div>
    </div>
  );
}

function TicketRow({ emoji, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base">{emoji}</span>
      <div>
        <p className="text-xs" style={{ color: '#94a3b8' }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{value}</p>
      </div>
    </div>
  );
}
