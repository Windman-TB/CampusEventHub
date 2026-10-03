import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchOrganizerEvents } from '../services/api';
import {
  fetchParticipants,
  patchTicketStatus,
  exportParticipants,
} from '../services/participants.api';

const TICKET_STATUS_CONFIG = {
  DaDangKy: { bg: '#fef9c3', text: '#a16207', label: 'Đã đăng ký' },
  DaCheckIn: { bg: '#dcfce7', text: '#15803d', label: 'Đã check-in' },
  DaHuy: { bg: '#fee2e2', text: '#b91c1c', label: 'Đã hủy' },
};

const getEventStatusBadge = (status) => {
  switch (status) {
    case 'BanNhap':
      return { label: 'Bản nháp', bg: '#f1f5f9', text: '#475569' };
    case 'SapToChuc':
      return { label: 'Sắp diễn ra', bg: '#e0e7ff', text: '#4338ca' };
    case 'DangDienRa':
      return { label: 'Đang diễn ra', bg: '#dcfce7', text: '#15803d' };
    case 'DaKetThuc':
      return { label: 'Đã kết thúc', bg: '#fee2e2', text: '#b91c1c' };
    default:
      return { label: status || 'Không xác định', bg: '#f1f5f9', text: '#475569' };
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return String(timeStr).substring(0, 5);
};

export default function ParticipantsPage() {
  // Danh sách sự kiện của BTC
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  // Sự kiện đang được chọn
  const [selectedEventId, setSelectedEventId] = useState(null);
  const selectedEvent = events.find((e) => String(e.ma_su_kien) === String(selectedEventId));

  // Danh sách người tham gia
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsMeta, setParticipantsMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // UI States
  const [toast, setToast] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null); // 'csv' | 'xlsx' | null
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Tải danh sách sự kiện của BTC
  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);
      setEventsError(null);
      try {
        const res = await fetchOrganizerEvents();
        setEvents(res.data || []);
      } catch (err) {
        setEventsError(err.message || 'Không thể tải danh sách sự kiện');
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  // 2. Tải danh sách người tham gia của sự kiện được chọn
  const loadParticipants = useCallback(
    async (eventId, p = page, st = statusFilter, kw = search) => {
      if (!eventId) return;
      setLoadingParticipants(true);
      try {
        const res = await fetchParticipants(eventId, {
          status: st !== 'all' ? st : undefined,
          search: kw.trim() || undefined,
          page: p,
          limit: 15,
        });

        setParticipants(res.data || []);
        if (res.meta) {
          setParticipantsMeta(res.meta);
        }
      } catch (err) {
        showToast(err.message || 'Không thể tải danh sách người tham gia', 'error');
      } finally {
        setLoadingParticipants(false);
      }
    },
    [page, statusFilter, search]
  );

  useEffect(() => {
    if (selectedEventId) {
      loadParticipants(selectedEventId, page, statusFilter, search);
    }
  }, [selectedEventId, page, statusFilter, search, loadParticipants]);

  // Handler đổi trạng thái vé thủ công (ví dụ Check-in tay cho sinh viên)
  const handleCheckInManual = async (ticketId, currentStatus) => {
    if (currentStatus === 'DaCheckIn') return;

    if (!window.confirm('Xác nhận điểm danh thủ công cho người tham gia này?')) {
      return;
    }

    setUpdatingTicketId(ticketId);
    try {
      await patchTicketStatus(ticketId, 'DaCheckIn');
      showToast('Điểm danh thành công!');
      // Cập nhật local state ngay lập tức
      setParticipants((prev) =>
        prev.map((p) =>
          p.ma_dang_ky === ticketId
            ? { ...p, trang_thai_ve: 'DaCheckIn', thoi_gian_check_in: new Date().toISOString() }
            : p
        )
      );
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật trạng thái vé', 'error');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // Handler xuất dữ liệu CSV / Excel
  const handleExport = async (format) => {
    if (!selectedEventId) return;
    setExportingFormat(format);
    try {
      await exportParticipants(selectedEventId, format);
      showToast(`Đã xuất file ${format.toUpperCase()} thành công!`);
    } catch (err) {
      showToast(err.message || `Lỗi xuất file ${format.toUpperCase()}`, 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  // =========================================================================
  // VIEW 1: Danh sách sự kiện để chọn
  // =========================================================================
  if (!selectedEventId) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-screen-xl">
          {/* Header */}
          <div className="mb-6">
            <h1
              className="font-bold text-2xl"
              style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}
            >
              Người tham gia sự kiện
            </h1>
            <p className="text-sm mt-1 text-slate-500">
              Chọn sự kiện để tra cứu danh sách người tham gia, điểm danh thủ công và xuất file báo cáo
            </p>
          </div>

          {/* Loading State */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
                  <div className="h-28 bg-slate-100 rounded-xl mb-4" />
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : eventsError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
              <div className="font-semibold mb-1">Không thể tải danh sách sự kiện:</div>
              <div>{eventsError}</div>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Chưa có sự kiện nào</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Bạn chưa tổ chức sự kiện nào. Hãy tạo sự kiện mới trong mục "Quản lý sự kiện" trước.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {events.map((event) => {
                const badge = getEventStatusBadge(event.trang_thai_su_kien);
                return (
                  <div
                    key={event.ma_su_kien}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner */}
                      <div
                        className="relative h-28 flex items-center justify-center overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)' }}
                      >
                        {event.anh_bia ? (
                          <img
                            src={event.anh_bia}
                            alt={event.ten_su_kien}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-3xl">🎓</span>
                        )}
                        <div className="absolute top-3 right-3">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-semibold text-base leading-snug mb-1 text-slate-900 line-clamp-2">
                          {event.ten_su_kien}
                        </h3>
                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                          <span>📅 {formatDate(event.ngay_dien_ra)}</span>
                          {event.thoi_gian_bat_dau && (
                            <span>· ⏰ {formatTime(event.thoi_gian_bat_dau)}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                          📍 {event.phong ? `${event.phong}, ` : ''}{event.dia_diem}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        onClick={() => {
                          setSelectedEventId(event.ma_su_kien);
                          setPage(1);
                          setSearch('');
                          setStatusFilter('all');
                        }}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
                      >
                        Xem danh sách người tham gia →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // VIEW 2: Danh sách người tham gia chi tiết của sự kiện đã chọn
  // =========================================================================
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold animate-fade-in ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Nút quay lại */}
        <button
          onClick={() => setSelectedEventId(null)}
          className="inline-flex items-center gap-2 mb-4 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <span>←</span> Quay lại danh sách sự kiện
        </button>

        {/* Header & Export Action */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Sự kiện #{selectedEventId}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {formatDate(selectedEvent?.ngay_dien_ra)}
              </span>
            </div>
            <h1
              className="font-bold text-2xl text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {selectedEvent?.ten_su_kien}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tổng cộng <strong>{participantsMeta.total}</strong> người đăng ký
            </p>
          </div>

          {/* Nút Xuất file CSV & Excel */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exportingFormat !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
              title="Xuất file CSV chuẩn UTF-8 (mở tiếng Việt không lỗi font)"
            >
              <span>📄</span>
              <span>{exportingFormat === 'csv' ? 'Đang xuất...' : 'Xuất CSV'}</span>
            </button>

            <button
              onClick={() => handleExport('xlsx')}
              disabled={exportingFormat !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20"
              title="Xuất bảng tính Microsoft Excel XLSX"
            >
              <span>📊</span>
              <span>{exportingFormat === 'xlsx' ? 'Đang xuất...' : 'Xuất Excel'}</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Tabs lọc trạng thái */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          {/* Tabs trạng thái */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'DaDangKy', label: 'Đã đăng ký' },
              { id: 'DaCheckIn', label: 'Đã check-in' },
              { id: 'DaHuy', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input tìm kiếm */}
          <div className="relative min-w-[280px] max-w-sm flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo MSSV hoặc họ tên..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-indigo-600 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Bảng dữ liệu người tham gia */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">STT</th>
                  <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Sinh viên</th>
                  <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Khoa</th>
                  <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Thời gian đặt</th>
                  <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Trạng thái vé</th>
                  <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingParticipants ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh sách người tham gia...</span>
                      </div>
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      Không có người tham gia nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  participants.map((p, idx) => {
                    const stConfig =
                      TICKET_STATUS_CONFIG[p.trang_thai_ve] || TICKET_STATUS_CONFIG.DaDangKy;
                    const stt = (participantsMeta.page - 1) * participantsMeta.limit + idx + 1;
                    return (
                      <tr key={p.ma_dang_ky} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{stt}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{p.ho_ten || '—'}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            {p.mssv && (
                              <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                {p.mssv}
                              </span>
                            )}
                            <span>{p.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{p.khoa || 'Chưa cập nhật'}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                          {p.thoi_gian_tao ? new Date(p.thoi_gian_tao).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: stConfig.bg, color: stConfig.text }}
                          >
                            <span>●</span>
                            <span>{stConfig.label}</span>
                          </span>
                          {p.trang_thai_ve === 'DaCheckIn' && p.thoi_gian_check_in && (
                            <div className="text-[11px] text-emerald-600 mt-1">
                              ✓ {new Date(p.thoi_gian_check_in).toLocaleTimeString('vi-VN')}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {p.trang_thai_ve === 'DaDangKy' ? (
                            <button
                              onClick={() => handleCheckInManual(p.ma_dang_ky, p.trang_thai_ve)}
                              disabled={updatingTicketId === p.ma_dang_ky}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              title="Điểm danh thủ công cho sinh viên này"
                            >
                              {updatingTicketId === p.ma_dang_ky ? 'Đang lưu...' : 'Check-in tay'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {participantsMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600">
              <div>
                Trang <strong>{participantsMeta.page}</strong> / <strong>{participantsMeta.totalPages}</strong>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={participantsMeta.page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(participantsMeta.totalPages, prev + 1))}
                  disabled={participantsMeta.page >= participantsMeta.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
