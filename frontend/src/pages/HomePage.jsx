import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { Search, Filter, Calendar, MapPin, Bell, X, Check, CalendarDays, RefreshCw, Clock } from 'lucide-react';

import { getPublicEvents, getNotifications } from '../services/eventService';

import { fetchCategories } from '../services/api';

import { BottomNav } from '../layouts/MainLayout';

const PAGE_SIZE = 9;
const HEADER_COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#059669', '#d97706'];

function parseLocalEventDate(value) {
  const match = String(value ?? '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(year, month - 1, day);

  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return null;
  }
  return result;
}

function isPastEvent(event) {
  if (event.trang_thai_su_kien === 'DaKetThuc') return true;
  const eventDate = parseLocalEventDate(event.ngay_dien_ra);
  if (!eventDate) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return eventDate < today;
}

function getTicketStatusBadge(event) {
  if (isPastEvent(event)) return { label: 'Đã kết thúc', bg: 'bg-slate-200', text: 'text-slate-600' };
  if (Number(event.so_ve_con_lai ?? 0) <= 0) return { label: 'Hết chỗ', bg: 'bg-rose-100', text: 'text-rose-600' };
  if (Number(event.so_ve_con_lai) <= Number(event.so_luong_toi_da) * 0.2) {
    return { label: 'Sắp hết', bg: 'bg-amber-100', text: 'text-amber-700' };
  }
  return { label: 'Còn chỗ', bg: 'bg-emerald-100', text: 'text-emerald-700' };
}

function buildEventParams({ search, topic, ticketStatus, date, location, sortBy }, page) {
  const params = { page, limit: PAGE_SIZE, sortBy };
  if (search) params.keyword = search;
  if (topic !== 'all') params.ma_chuyen_de = topic;
  if (ticketStatus !== 'all') params.ticketStatus = ticketStatus;
  if (date) params.ngay_dien_ra = date;
  if (location) params.dia_diem = location;
  return params;
}

export default function HomePage() {
  const navigate = useNavigate();

  // Bộ lọc; backend chịu trách nhiệm sắp xếp trước khi phân trang.
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [ticketStatus, setTicketStatus] = useState('all');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('date_asc');

  // Key để không hiển thị kết quả cũ khi bộ lọc vừa thay đổi.
  const queryKey = JSON.stringify([
    debouncedSearch, topic, ticketStatus, date, location.trim(), sortBy,
  ]);
  const [listing, setListing] = useState({
    key: null,
    items: [],
    total: 0,
    page: 0,
    loadingMore: false,
    error: '',
  });
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [categories, setCategories] = useState([]);
  const [modalTopic, setModalTopic] = useState('all');
  const [modalTicket, setModalTicket] = useState('all');
  const [modalDate, setModalDate] = useState('');
  const [modalLocation, setModalLocation] = useState('');

  let displayUser = null;
  try {
    displayUser = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    // Không để một localStorage bị lỗi JSON làm trắng cả trang.
  }
  const userName = displayUser?.ho_ten || displayUser?.name || 'Khách';
  const userInitials = userName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(-2)
    .toUpperCase();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 450);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  // Mọi thay đổi bộ lọc đều được xử lý tại duy nhất effect này.
  useEffect(() => {
    let active = true;
    const params = buildEventParams({
      search: debouncedSearch,
      topic,
      ticketStatus,
      date,
      location: location.trim(),
      sortBy,
    }, 1);

    getPublicEvents(params)
      .then((response) => {
        if (!active) return;
        if (!response?.success) {
          throw new Error(response?.message || 'Không tải được danh sách sự kiện');
        }
        setListing({
          key: queryKey,
          items: Array.isArray(response.data?.events) ? response.data.events : [],
          total: Number(response.data?.total ?? 0),
          page: 1,
          loadingMore: false,
          error: '',
        });
      })
      .catch((err) => {
        if (!active) return;
        setListing({
          key: queryKey,
          items: [],
          total: 0,
          page: 1,
          loadingMore: false,
          error: err.message || 'Không tải được danh sách sự kiện',
        });
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, topic, ticketStatus, date, location, sortBy, queryKey, refreshNonce]);

  // Các dữ liệu phụ tải độc lập với bộ lọc sự kiện.
  useEffect(() => {
    let active = true;

    getNotifications()
      .then((response) => {
        if (active && response?.success && Array.isArray(response.data)) {
          setNotifications(response.data);
        }
      })
      .catch((err) => {
        console.error('Không tải được thông báo:', err);
      });

    fetchCategories()
      .then((response) => {
        if (active && response?.success && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      })
      .catch((err) => {
        console.error('Không tải được chuyên đề:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const loading = listing.key !== queryKey;
  const events = loading ? [] : listing.items;
  const total = loading ? 0 : listing.total;
  const loadingMore = !loading && listing.loadingMore;
  const listError = loading ? '' : listing.error;
  const unreadCount = notificationsRead
    ? 0
    : notifications.filter((item) => item.isNew).length;
  const newNotifications = notifications.filter((item) => item.isNew && !notificationsRead);
  const previousNotifications = notifications.filter((item) => !item.isNew || notificationsRead);

  function handleSearchChange(event) {
    setSearch(event.target.value);
  }

  function handleTopicChange(nextTopic) {
    const value = String(nextTopic);
    setTopic((current) => current === value ? 'all' : value);
  }

  function handleTicketStatusChange(nextStatus) {
    setTicketStatus((current) => current === nextStatus ? 'all' : nextStatus);
  }

  function openFilterModal() {
    setModalTopic(topic);
    setModalTicket(ticketStatus);
    setModalDate(date);
    setModalLocation(location);
    setShowFilterModal(true);
  }

  function applyModalFilters() {
    setTopic(modalTopic);
    setTicketStatus(modalTicket);
    setDate(modalDate);
    setLocation(modalLocation.trim());
    setShowFilterModal(false);
  }

  function clearModalFilters() {
    setModalTopic('all');
    setModalTicket('all');
    setModalDate('');
    setModalLocation('');
    setTopic('all');
    setTicketStatus('all');
    setDate('');
    setLocation('');
    setShowFilterModal(false);
  }

  async function loadMore() {
    if (loading || loadingMore || events.length >= total || listing.page < 1) return;
    const expectedKey = queryKey;
    const nextPage = listing.page + 1;

    setListing((current) => current.key === expectedKey
      ? { ...current, loadingMore: true, error: '' }
      : current);

    try {
      const response = await getPublicEvents(buildEventParams({
        search: debouncedSearch,
        topic,
        ticketStatus,
        date,
        location: location.trim(),
        sortBy,
      }, nextPage));

      if (!response?.success) {
        throw new Error(response?.message || 'Không thể tải thêm sự kiện');
      }

      const nextItems = Array.isArray(response.data?.events) ? response.data.events : [];
      setListing((current) => {
        if (current.key !== expectedKey || current.page !== nextPage - 1) return current;
        const existingIds = new Set(current.items.map((item) => String(item.ma_su_kien)));
        const uniqueItems = nextItems.filter((item) => !existingIds.has(String(item.ma_su_kien)));
        return {
          ...current,
          items: [...current.items, ...uniqueItems],
          total: Number(response.data?.total ?? current.total),
          page: nextPage,
          loadingMore: false,
        };
      });
    } catch (err) {
      setListing((current) => current.key === expectedKey
        ? { ...current, loadingMore: false, error: err.message || 'Không thể tải thêm sự kiện' }
        : current);
    }
  }

  return (

    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative pb-20">

      {/* HEADER */}

      <div className="bg-white sticky top-0 z-10 shadow-sm border-b">

        <div className="max-w-screen-xl mx-auto">

          {/* Top Bar */}

          <div className="flex items-center justify-between px-4 py-4">

            <div>

              <p className="text-sm font-medium text-slate-500 mb-0.5">Xin chào, {userName} 👋</p>

              <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">

                Khám phá sự kiện

              </h1>

            </div>

            <div className="flex items-center gap-4">

              <button type="button" aria-label="Mở thông báo" className="relative cursor-pointer" onClick={() => setShowNotifications(true)}>

                <Bell size={22} className="text-slate-600" />

                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}

              </button>

              <button type="button" aria-label="Xem hồ sơ" onClick={() => navigate('/profile')} className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer">

                {userInitials || '👤'}

              </button>

            </div>

          </div>

          {/* Search, Sort & Filter */}

          <div className="px-4 pb-3 flex flex-wrap md:flex-nowrap gap-2">

            <div className="flex-1 relative min-w-[200px]">

              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

              <input

                value={search}

                onChange={handleSearchChange}

                placeholder="Tìm kiếm sự kiện, diễn giả..."

                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"

              />

            </div>

            <div className="flex gap-2">

              <select

                value={sortBy}

                onChange={(e) => setSortBy(e.target.value)}

                className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors outline-none cursor-pointer"

              >

                <option value="date_asc">Sắp diễn ra</option>

                <option value="date_latest">Thời gian diễn ra trễ nhất</option>

                <option value="date_earliest">Thời gian diễn ra sớm nhất</option>

                <option value="name_asc">Tên (A-Z)</option>

                <option value="name_desc">Tên (Z-A)</option>

              </select>

              <button

                onClick={openFilterModal}

                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors shrink-0"

              >

                <Filter size={16} /> Bộ lọc

              </button>

            </div>

          </div>

          {/* Quick Filter Row 1: Topics */}

          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">

            <button onClick={() => handleTopicChange('all')}

              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${topic === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>

              Tất cả

            </button>

            {categories.map(c => (

              <button key={c.ma_chuyen_de} onClick={() => handleTopicChange(String(c.ma_chuyen_de))}

                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${topic === String(c.ma_chuyen_de) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>

                {c.ten_chuyen_de}

              </button>

            ))}

          </div>

          {/* Quick Filter Row 2: Ticket Status */}

          <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">

             {['Còn chỗ', 'Sắp hết', 'Hết chỗ'].map(st => (

               <button

                 key={st}

                 onClick={() => handleTicketStatusChange(st)}

                 className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${ticketStatus === st ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>

                 {st}

               </button>

             ))}

          </div>

        </div>

      </div>

      {/* BODY */}

      <div className="flex-1 max-w-screen-xl mx-auto w-full">

        <div className="px-4 py-4">

          <p className="text-xs font-semibold text-slate-500 mb-3">{loading ? 'Đang tìm sự kiện...' : `${total} sự kiện`}</p>

          {listError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3">
              <span>{listError}</span>
              <button type="button" onClick={() => setRefreshNonce((value) => value + 1)} className="font-semibold underline underline-offset-2">Thử lại</button>
            </div>
          )}

          {loading ? (

            <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>

          ) : events.length === 0 ? (

            <div className="text-center py-10 text-slate-500">Không tìm thấy sự kiện nào.</div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {events.map(event => {

                const colors = HEADER_COLORS;

                const bgHeaderColor = colors[(event.ma_chuyen_de - 1) % colors.length] || '#4f46e5';

                const topicName = event.chuyen_de?.ten_chuyen_de || 'Chuyên đề';

                const statusBadge = getTicketStatusBadge(event);

                const isFull = event.so_ve_con_lai <= 0;

                const isPast = isPastEvent(event);

                const pct = Number(event.so_luong_toi_da) > 0
                  ? Math.min(100, Math.max(0, Math.round((Number(event.so_ve_da_dat) / Number(event.so_luong_toi_da)) * 100)))
                  : 0;

                return (

                  <div key={event.ma_su_kien}

                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">

                    {/* Image Banner */}

                    <div className="relative h-44 bg-slate-200"

                      style={{

                        backgroundImage: event.anh_bia ? `url('${event.anh_bia}')` : `linear-gradient(135deg, ${bgHeaderColor}dd, ${bgHeaderColor}99)`,

                        backgroundSize: 'cover',

                        backgroundPosition: 'center',

                        backgroundRepeat: 'no-repeat'

                      }}>

                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">

                        <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-sm">

                          {topicName}

                        </span>

                        <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${statusBadge.bg} ${statusBadge.text}`}>

                          {statusBadge.label}

                        </span>

                        {(event.hasRegistered && !isPast) && (

                          <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1">

                            <Check size={12} strokeWidth={3} /> Đã đăng ký

                          </span>

                        )}

                      </div>

                    </div>

                    {/* Content */}

                    <div className="p-4 flex-1 flex flex-col">

                      <h3 className="font-bold text-base mb-1 line-clamp-2 text-slate-900 group-hover:text-indigo-600 transition-colors">

                        {event.ten_su_kien}

                      </h3>

                      <p className="text-xs text-slate-500 mb-3">{event.dien_gia || 'Đang cập nhật diễn giả'}</p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">

                        <Calendar size={14} className="text-slate-400" />

                        <span>{parseLocalEventDate(event.ngay_dien_ra)?.toLocaleDateString('vi-VN') || 'Chưa xác định'} - {event.thoi_gian_bat_dau}</span>

                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">

                        <MapPin size={14} className="text-slate-400" />

                        <span className="line-clamp-1">{event.dia_diem}{event.phong ? ` - ${event.phong}` : ''}</span>

                      </div>

                      <div className="mt-auto">

                        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">

                          <span>{event.so_ve_da_dat} / {event.so_luong_toi_da} chỗ đã đăng ký</span>

                          <span className={statusBadge.text}>{isPast ? 'Đã kết thúc' : (isFull ? '0 còn lại' : `${event.so_ve_con_lai} còn lại`)}</span>

                        </div>

                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">

                          <div className="h-full rounded-full transition-all"

                            style={{

                              width: `${Math.min(pct, 100)}%`,

                              background: isPast ? '#94a3b8' : (isFull ? '#ef4444' : pct > 80 ? '#f59e0b' : '#4f46e5')

                            }}

                          />

                        </div>

                        <button

                          onClick={() => navigate(`/events/${event.ma_su_kien}`)}

                          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${

                            isPast

                              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'

                              : event.hasRegistered

                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'

                                : isFull

                                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed'

                                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'

                          }`}>

                          {isPast ? 'Đã kết thúc' : (event.hasRegistered ? 'Đã đăng ký · Xem chi tiết' : (isFull ? 'Hết chỗ' : 'Xem chi tiết'))}

                        </button>

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

          {events.length > 0 && events.length < total && (

            <div className="mt-8 mb-4 text-center">

              <button

                onClick={loadMore}

                disabled={loading || loadingMore}

                className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors">

                {loadingMore ? 'Đang tải thêm...' : 'Xem thêm'}

              </button>

            </div>

          )}

        </div>

      </div>

      {/* FILTER MODAL */}

      {showFilterModal && (

        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterModal(false)}>

          <div className="bg-white w-full rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>

            <div className="flex justify-center mb-4">

              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>

            </div>

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-extrabold text-slate-900">Bộ lọc sự kiện</h2>

              <button onClick={() => setShowFilterModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">

                <X size={20} />

              </button>

            </div>

            <div className="mb-6">

              <h3 className="text-sm font-bold text-slate-700 mb-3">Chủ đề</h3>

              <div className="flex flex-wrap gap-2">

                <button onClick={() => setModalTopic('all')}

                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${modalTopic === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>

                  Tất cả

                </button>

                {categories.map(c => (

                  <button key={c.ma_chuyen_de} onClick={() => setModalTopic(String(c.ma_chuyen_de))}

                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${modalTopic === String(c.ma_chuyen_de) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>

                    {c.ten_chuyen_de}

                  </button>

                ))}

              </div>

            </div>

            <div className="mb-6">

              <h3 className="text-sm font-bold text-slate-700 mb-3">Trạng thái</h3>

              <div className="flex flex-wrap gap-2">

                {['Còn chỗ', 'Sắp hết', 'Hết chỗ'].map(st => (

                  <button key={st} onClick={() => setModalTicket((current) => current === st ? 'all' : st)}

                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${modalTicket === st ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>

                    {st}

                  </button>

                ))}

              </div>

            </div>

            <div className="mb-6">

              <h3 className="text-sm font-bold text-slate-700 mb-3">Ngày tổ chức</h3>

              <div className="relative">

                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                <input type="date" value={modalDate} onChange={(e) => setModalDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-600 bg-white focus:border-indigo-500" />

              </div>

            </div>

            <div className="mb-8">

              <h3 className="text-sm font-bold text-slate-700 mb-3">Địa điểm</h3>

              <input type="text" value={modalLocation} onChange={(e) => setModalLocation(e.target.value)} placeholder="Nhập địa điểm..." className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-600 bg-white focus:border-indigo-500" />

            </div>

            <div className="flex gap-3">

              <button onClick={clearModalFilters} className="px-6 py-3.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">

                Xóa bộ lọc

              </button>

              <button onClick={applyModalFilters} className="flex-1 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">

                Áp dụng

              </button>

            </div>

          </div>

        </div>

      )}

      {/* NOTIFICATION MODAL */}

      {showNotifications && (

        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>

          <div

            className="absolute top-[70px] right-4 w-[380px] max-w-[calc(100vw-2rem)] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"

            onClick={e => e.stopPropagation()}

          >

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">

              <h2 className="text-base font-extrabold text-slate-900">Thông báo</h2>

              <div className="flex items-center gap-3">

                <button onClick={() => setNotificationsRead(true)} className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">

                  Đánh dấu tất cả đã đọc

                </button>

                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors">

                  <X size={16} strokeWidth={2.5} />

                </button>

              </div>

            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 pt-4 pb-6">

              {newNotifications.length > 0 && (

                <>

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Mới</p>

                  <div className="flex flex-col gap-5 mb-6">

                    {newNotifications.map(notif => (

                      <div key={notif.id} className="flex gap-4 relative group cursor-pointer">

                        {notif.type === 'calendar' && (

                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">

                            <CalendarDays size={18} strokeWidth={2} />

                          </div>

                        )}

                        {notif.type === 'bell' && (

                          <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 group-hover:bg-cyan-100 transition-colors">

                            <Bell size={18} strokeWidth={2} />

                          </div>

                        )}

                        {notif.type === 'success' && (

                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">

                            <Check size={18} strokeWidth={2.5} />

                          </div>

                        )}

                        <div className="flex-1">

                          <h4 className="text-[13px] font-bold text-slate-800 mb-0.5">{notif.title}</h4>

                          <p className="text-[13px] font-medium text-slate-500 leading-snug mb-1.5">{notif.message}</p>

                          <p className="text-[11px] font-semibold text-slate-400">{notif.time}</p>

                        </div>

                        {unreadCount > 0 && <div className="absolute top-1.5 right-0 w-2 h-2 rounded-full bg-indigo-600"></div>}

                      </div>

                    ))}

                  </div>

                </>

              )}

              {previousNotifications.length > 0 && (

                <>

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Trước đó</p>

                  <div className="flex flex-col gap-5">

                    {previousNotifications.map(notif => (

                      <div key={notif.id} className="flex gap-4 group cursor-pointer">

                        {notif.type === 'success' && (

                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">

                            <Check size={18} strokeWidth={2.5} />

                          </div>

                        )}

                        {notif.type === 'update' && (

                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">

                            <RefreshCw size={18} strokeWidth={2} />

                          </div>

                        )}

                        {notif.type === 'warning' && (

                          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">

                            <Clock size={18} strokeWidth={2} />

                          </div>

                        )}

                        <div className="flex-1">

                          <h4 className="text-[13px] font-bold text-slate-800 mb-0.5">{notif.title}</h4>

                          <p className="text-[13px] font-medium text-slate-500 leading-snug mb-1.5">{notif.message}</p>

                          <p className="text-[11px] font-semibold text-slate-400">{notif.time}</p>

                        </div>

                      </div>

                    ))}

                  </div>

                </>

              )}

            </div>

          </div>

        </div>

      )}

      {/* 5. BOTTOM NAVIGATION */}

      <BottomNav />

    </div>

  );

}
