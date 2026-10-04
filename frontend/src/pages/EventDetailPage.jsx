import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Users, Check } from 'lucide-react';
import { getEventStatusLabel, TOPIC_LABELS, TOPIC_COLORS } from '../mocks/mockData';
import { getEventById } from '../services/eventService';

// Tạo mã vé ngẫu nhiên dạng TKT-YYYY-XXXXXX
function generateTicketId() {
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `TKT-${new Date().getFullYear()}-${num}`;
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Giới thiệu');
  const [registering, setRegistering] = useState(false);
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEventById(eventId);
        if (res.success) {
          setEvent(res.data);
          setRegistered(res.data.hasRegistered);
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết sự kiện:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;
  if (!event) return <div className="p-8 text-center font-medium">Không tìm thấy sự kiện</div>;

  const keys = Object.keys(TOPIC_LABELS);
  const mockKey = keys[(event.ma_chuyen_de - 1) % keys.length];
  const topicColor = TOPIC_COLORS[mockKey] || '#4f46e5';
  
  const isFull = event.so_ve_con_lai <= 0;
  const pct = event.so_luong_toi_da > 0 ? Math.round((event.so_ve_da_dat / event.so_luong_toi_da) * 100) : 100;

  // Ticket Status Badge - Dựa trên thiết kế Figma
  const getTicketStatusBadge = () => {
    if (event.so_ve_con_lai <= 0) return { label: 'Hết chỗ', bg: 'bg-rose-500/80 text-white' };
    if (event.so_ve_con_lai <= event.so_luong_toi_da * 0.2) return { label: 'Sắp hết', bg: 'bg-amber-500/80 text-white' };
    return { label: 'Còn chỗ', bg: 'bg-white/20 text-white backdrop-blur-sm' }; 
  };
  const statusBadge = getTicketStatusBadge();

  // Xử lý format ngày tháng hiển thị như Figma: "Thứ Sáu, 20/11/2026"
  const dateObj = new Date(event.ngay_dien_ra);
  const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'long' });
  const dateStr = dateObj.toLocaleDateString('vi-VN');
  
  // Dữ liệu Mock User Info cho mục Form "Thông tin đăng ký"
  const studentInfo = {
    mssv: '22521001',
    name: 'Cao Duy Anh',
    email: 'caoduyanh@uit.edu.vn',
    faculty: 'Công nghệ Thông tin'
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 font-sans">
      {/* 1. TOP BANNER */}
      <div className="relative h-72 flex flex-col justify-end p-5"
        style={{ 
          backgroundImage: event.anh_bia ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url('${event.anh_bia}')` : `linear-gradient(135deg, #4b5563, #1f2937)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        {/* Nút Back */}
        <button onClick={() => navigate(-1)} className="absolute top-5 left-4 w-10 h-10 bg-black/20 hover:bg-black/40 transition-colors text-white rounded-full flex items-center justify-center backdrop-blur-md">
          <ChevronLeft size={24} />
        </button>

        {/* Nội dung trên Banner */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[11px] font-bold shadow-sm uppercase tracking-wide">
              {TOPIC_LABELS[mockKey] || 'Chuyên đề'}
            </span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm uppercase tracking-wide ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-white leading-tight mb-1.5 drop-shadow-md">{event.ten_su_kien}</h1>
            <p className="text-sm font-medium text-slate-200 drop-shadow">{event.to_chuc || 'Ban tổ chức'}</p>
          </div>
        </div>
      </div>

      {/* 2. INFO SECTION */}
      <div className="px-5 py-5 flex flex-col gap-3.5 border-b border-slate-100">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Calendar size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-slate-700">{dayName}, {dateStr} • {event.thoi_gian_bat_dau} - {event.thoi_gian_ket_thuc}</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <MapPin size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-slate-700">{event.dia_diem}{event.phong ? `, ${event.phong}` : ''}</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Users size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-slate-700">{event.so_ve_da_dat} / {event.so_luong_toi_da} chỗ đã đăng ký • còn {event.so_ve_con_lai} chỗ</span>
        </div>
      </div>

      {/* 3. PROGRESS BAR SECTION */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex justify-between items-center mb-2.5">
          <span className="font-extrabold text-[13px] text-slate-800 tracking-wide">Tình trạng chỗ trống</span>
          <span className="font-extrabold text-[13px] text-emerald-600">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
           <div className="h-full rounded-full transition-all duration-500 ease-out" 
             style={{ 
               width: `${Math.min(pct, 100)}%`, 
               background: isFull ? '#ef4444' : '#4f46e5' 
             }} 
           />
        </div>
      </div>

      {/* 4. TABS SECTION */}
      <div className="flex px-5 border-b border-slate-100 overflow-x-auto no-scrollbar gap-8">
        {['Giới thiệu', 'Lịch trình', 'Diễn giả', 'Quyền lợi'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-4 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* 5. TAB CONTENT & REGISTRATION INFO */}
      <div className="px-5 py-6">
        {tab === 'Giới thiệu' && (
          <div className="text-[13px] text-slate-600 font-medium leading-relaxed mb-8 whitespace-pre-wrap">
            {event.mo_ta || 'Đêm nhạc acoustic do sinh viên biểu diễn với các tiết mục đa dạng: nhạc trẻ, dân ca, indie. Không gian lãng mạn dưới bầu trời đêm trong khuôn viên trường.'}
          </div>
        )}
        
        {tab === 'Lịch trình' && (
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-stretch">
              <div className="w-14 text-[13px] font-semibold text-indigo-600 shrink-0 pt-0.5">18:00</div>
              <div className="pl-4 border-l-2 border-slate-200 text-[13px] font-medium text-slate-700 pb-2">Khai mạc & Nhạc nền</div>
            </div>
            <div className="flex items-stretch">
              <div className="w-14 text-[13px] font-semibold text-indigo-600 shrink-0 pt-0.5">18:30</div>
              <div className="pl-4 border-l-2 border-slate-200 text-[13px] font-medium text-slate-700 pb-2">Biểu diễn các ban nhạc sinh viên</div>
            </div>
            <div className="flex items-stretch">
              <div className="w-14 text-[13px] font-semibold text-indigo-600 shrink-0 pt-0.5">20:00</div>
              <div className="pl-4 border-l-2 border-slate-200 text-[13px] font-medium text-slate-700 pb-2">Acoustic Night – Cùng hát</div>
            </div>
            <div className="flex items-stretch">
              <div className="w-14 text-[13px] font-semibold text-indigo-600 shrink-0 pt-0.5">21:00</div>
              <div className="pl-4 border-l-2 border-transparent text-[13px] font-medium text-slate-700">Kết thúc</div>
            </div>
          </div>
        )}
        
        {tab === 'Diễn giả' && (
          <div className="mb-8">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                {event.dien_gia ? event.dien_gia.charAt(0) : 'C'}
              </div>
              <div>
                <h4 className="font-bold text-[13px] text-slate-800">{event.dien_gia || 'CLB Âm nhạc & Các ban nhạc sinh viên'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{event.to_chuc || 'Đơn vị tổ chức'}</p>
              </div>
            </div>
          </div>
        )}
        
        {tab === 'Quyền lợi' && (
          <div className="mb-8 flex flex-col gap-3">
            {[
              'Cộng điểm rèn luyện',
              'Giao lưu nghệ thuật',
              'Đồ uống miễn phí'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-600 stroke-[4]" />
                </div>
                <span className="text-[13px] font-medium text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Thông tin sinh viên Form */}
        <h3 className="font-extrabold text-[13px] text-slate-900 mb-4 tracking-wide">Thông tin đăng ký</h3>
        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-3.5 rounded-xl mb-6 flex items-center gap-2.5 border border-emerald-100">
          <Check size={16} className="text-emerald-600 stroke-[3]" /> 
          Thông tin được tự động điền từ hồ sơ cá nhân
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-3">
            <span className="text-slate-500 font-medium">MSSV</span>
            <span className="font-bold text-slate-800">{studentInfo.mssv}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-3">
            <span className="text-slate-500 font-medium">Họ và tên</span>
            <span className="font-bold text-slate-800">{studentInfo.name}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-3">
            <span className="text-slate-500 font-medium">Email sinh viên</span>
            <span className="font-bold text-slate-800">{studentInfo.email}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-3">
            <span className="text-slate-500 font-medium">Khoa / Viện</span>
            <span className="font-bold text-slate-800">{studentInfo.faculty}</span>
          </div>
        </div>
      </div>

      {/* 6. FIXED BOTTOM CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => {
            if (registered) {
              navigate('/tickets');
              return;
            }
            if (isFull) return;
            setRegistering(true);
            setTimeout(() => {
              setRegistering(false);
              setRegistered(true);
              navigate('/ticket-confirm', {
                state: { event: { id: event.ma_su_kien, title: event.ten_su_kien } }
              });
            }, 1000);
          }}
          disabled={registering || (isFull && !registered)}
          className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-sm ${
            registered 
              ? 'bg-indigo-50 text-indigo-700' 
              : isFull 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
          }`}
        >
          {registering ? 'Đang xử lý...' : (registered ? 'Xem vé của tôi' : (isFull ? 'Hết chỗ' : 'Đăng ký ngay'))}
        </button>
      </div>
    </div>
  );
}