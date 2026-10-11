import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Users, Check } from 'lucide-react';
import { getEventById } from '../services/eventService';

function parseLocalEventDate(value) {
  if (!value) return null;

  const dateString = String(value).slice(0, 10);
  const parts = dateString.split('-').map(Number);

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatEventTime(value) {
  return value ? String(value).slice(0, 5) : 'Chưa cập nhật';
}

function readStudentInfo() {
  let user = {};

  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && typeof parsedUser === 'object') {
        user = parsedUser;
      }
    }
  } catch {
    // Dữ liệu phiên không hợp lệ: không làm trang chi tiết bị lỗi.
  }

  return {
    mssv: user.mssv || 'Không có MSSV',
    name: user.ho_ten || 'Người dùng ẩn danh',
    email: user.email || 'N/A',
    faculty: user.khoa || 'Chưa cập nhật',
  };
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('Giới thiệu');
  const [detail, setDetail] = useState({
    eventId: null,
    event: null,
    error: '',
  });

  // Chỉ sử dụng dữ liệu thuộc đúng eventId hiện tại.
  // Bỏ qua kết quả trả về của request cũ khi đổi trang hoặc unmount.
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      try {
        const response = await getEventById(eventId);
        if (cancelled) return;

        if (response?.success && response.data) {
          setDetail({ eventId, event: response.data, error: '' });
        } else {
          setDetail({
            eventId,
            event: null,
            error: response?.message || 'Không tìm thấy sự kiện.',
          });
        }
      } catch (error) {
        if (cancelled) return;

        console.error('Lỗi lấy chi tiết sự kiện:', error);
        setDetail({
          eventId,
          event: null,
          error: error?.response?.data?.message || error?.message || 'Không tải được sự kiện.',
        });
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const loading = detail.eventId !== eventId;
  const event = loading ? null : detail.event;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium" role="status">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center">
        <p className="font-medium text-slate-700">
          {detail.error || 'Không tìm thấy sự kiện.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const registered = Boolean(event.hasRegistered);
  const capacity = Number(event.so_luong_toi_da) || 0;
  const booked = Number(event.so_ve_da_dat) || 0;
  const remaining = Math.max(0, Number(event.so_ve_con_lai) || 0);
  const isFull = remaining <= 0;
  const pct = capacity > 0 ? Math.min(100, Math.max(0, Math.round((booked / capacity) * 100))) : 0;

  const dateObj = parseLocalEventDate(event.ngay_dien_ra);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isToday = Boolean(dateObj && dateObj.getTime() === today.getTime());
  const isPast = event.trang_thai_su_kien === 'DaKetThuc' ||
    Boolean(dateObj && dateObj.getTime() < today.getTime());
  const isDraft = event.trang_thai_su_kien === 'BanNhap';
  const canRegister = !registered && !isPast && !isDraft && !isFull;

  const topicName = event.chuyen_de?.ten_chuyen_de || 'Chuyên đề';
  const dayName = dateObj
    ? dateObj.toLocaleDateString('vi-VN', { weekday: 'long' })
    : 'Chưa xác định';
  const dateStr = dateObj ? dateObj.toLocaleDateString('vi-VN') : 'Chưa cập nhật';
  const startTime = formatEventTime(event.thoi_gian_bat_dau);
  const endTime = formatEventTime(event.thoi_gian_ket_thuc);
  const studentInfo = readStudentInfo();

  let statusBadge;
  if (isPast) {
    statusBadge = { label: 'Đã kết thúc', bg: 'bg-slate-500/80 text-white' };
  } else if (isDraft) {
    statusBadge = { label: 'Chưa mở', bg: 'bg-slate-500/80 text-white' };
  } else if (isFull) {
    statusBadge = { label: 'Hết chỗ', bg: 'bg-rose-500/80 text-white' };
  } else if (capacity > 0 && remaining <= capacity * 0.2) {
    statusBadge = { label: 'Sắp hết', bg: 'bg-amber-500/80 text-white' };
  } else {
    statusBadge = { label: 'Còn chỗ', bg: 'bg-white/20 text-white backdrop-blur-sm' };
  }

  const benefits = String(event.quyen_loi || '')
    .replace(/\*\*\*\s*\*\*\*/g, '\n')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  function handleRegistration() {
    if (registered) {
      navigate('/tickets');
      return;
    }

    if (!canRegister) return;

    // TicketConfirmPage gọi POST /api/tickets/book để đặt vé thật.
    // KHÔNG tạo QR hoặc mã vé giả ở frontend.
    navigate('/ticket-confirm', {
      state: {
        eventId: event.ma_su_kien,
        event: {
          ...event,
          id: event.ma_su_kien,
          title: event.ten_su_kien,
        },
        studentName: studentInfo.name,
        studentId: studentInfo.mssv,
        faculty: studentInfo.faculty,
      },
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 font-sans">
      {/* 1. TOP BANNER */}
      <div
        className="relative h-72 flex flex-col justify-end p-5"
        style={{
          backgroundImage: event.anh_bia
            ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url('${event.anh_bia}')`
            : 'linear-gradient(135deg, #4b5563, #1f2937)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
          className="absolute top-5 left-4 w-10 h-10 bg-black/20 hover:bg-black/40 transition-colors text-white rounded-full flex items-center justify-center backdrop-blur-md"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[11px] font-bold shadow-sm uppercase tracking-wide">
              {topicName}
            </span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm uppercase tracking-wide ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-white leading-tight mb-1.5 drop-shadow-md">
              {event.ten_su_kien}
            </h1>
            <p className="text-sm font-medium text-slate-200 drop-shadow">
              {event.to_chuc || 'Ban tổ chức'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. EVENT INFORMATION */}
      <div className="px-5 py-5 flex flex-col gap-3.5 border-b border-slate-100">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Calendar size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-slate-700">
            {dayName}, {dateStr} • {startTime} - {endTime}
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <MapPin size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-slate-700">
            {event.dia_diem || 'Chưa cập nhật'}{event.phong ? `, ${event.phong}` : ''}
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Users size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-slate-700">
            {booked} / {capacity} chỗ đã đăng ký • còn {remaining} chỗ
          </span>
        </div>
      </div>

      {/* 3. CAPACITY PROGRESS */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex justify-between items-center mb-2.5">
          <span className="font-extrabold text-[13px] text-slate-800 tracking-wide">
            Tỷ lệ lấp đầy
          </span>
          <span className="font-extrabold text-[13px] text-emerald-600">{pct}%</span>
        </div>
        <div
          className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Tỷ lệ lấp đầy"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: isFull ? '#ef4444' : '#4f46e5',
            }}
          />
        </div>
      </div>

      {/* 4. TABS */}
      <div className="flex px-5 border-b border-slate-100 overflow-x-auto no-scrollbar gap-8">
        {['Giới thiệu', 'Diễn giả', 'Quyền lợi'].map((tabName) => (
          <button
            type="button"
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`py-4 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${
              tab === tabName
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {/* 5. TAB CONTENT + STUDENT INFO */}
      <div className="px-5 py-6">
        {tab === 'Giới thiệu' && (
          <div className="text-[13px] text-slate-600 font-medium leading-relaxed mb-8 whitespace-pre-wrap">
            {event.mo_ta || 'Chưa có mô tả cho sự kiện này.'}
          </div>
        )}

        {tab === 'Diễn giả' && (
          <div className="mb-8">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                {(event.dien_gia || event.to_chuc || 'C').charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-[13px] text-slate-800">
                  {event.dien_gia || event.to_chuc || 'Đang cập nhật'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.to_chuc || 'Đơn vị tổ chức'}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'Quyền lợi' && (
          <div className="mb-8 flex flex-col gap-3">
            {(benefits.length > 0 ? benefits : ['Đang cập nhật']).map((item, index) => (
              <div key={`${index}-${item}`} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-600 stroke-[4]" />
                </div>
                <span className="text-[13px] font-medium text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        )}

        <h3 className="font-extrabold text-[13px] text-slate-900 mb-4 tracking-wide">
          Thông tin đăng ký
        </h3>
        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-3.5 rounded-xl mb-6 flex items-center gap-2.5 border border-emerald-100">
          <Check size={16} className="text-emerald-600 stroke-[3]" />
          Thông tin được tự động điền từ hồ sơ cá nhân
        </div>

        <div className="space-y-4">
          {[
            ['MSSV', studentInfo.mssv],
            ['Họ và tên', studentInfo.name],
            ['Email sinh viên', studentInfo.email],
            ['Khoa / Viện', studentInfo.faculty],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between items-center gap-4 text-[13px] border-b border-slate-100 pb-3"
            >
              <span className="text-slate-500 font-medium">{label}</span>
              <span className="font-bold text-slate-800 text-right break-words">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. FIXED BOTTOM ACTION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {event.canCheckin && isToday ? (
          <button
            type="button"
            onClick={() => navigate('/check-in')}
            className="w-full py-3.5 rounded-xl font-bold transition-all shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
          >
            Điểm danh sự kiện
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRegistration}
            disabled={!registered && !canRegister}
            className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
              registered
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : isPast || isDraft
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : isFull
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            {registered ? (
              <>
                <Check size={18} className="text-emerald-600 stroke-[3]" />
                Đã đăng ký - Xem vé
              </>
            ) : isPast ? (
              'Đã kết thúc'
            ) : isDraft ? (
              'Chưa mở đăng ký'
            ) : isFull ? (
              'Hết chỗ'
            ) : (
              'Đăng ký ngay'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
