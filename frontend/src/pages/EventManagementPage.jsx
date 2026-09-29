// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import DashboardLayout from '../layouts/DashboardLayout';
// import { MOCK_EVENTS, getEventStatusLabel, getEventStatusColors } from '../mocks/mockData';

// export default function EventManagementPage() {
//   const navigate = useNavigate();
//   const [filter, setFilter] = useState('all');
//   const [search, setSearch] = useState('');

//   const filteredEvents = MOCK_EVENTS.filter(e => {
//     if (filter !== 'all' && e.status !== filter) return false;
//     if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
//     return true;
//   });

//   return (
//     <DashboardLayout>
//       <div className="p-6 lg:p-8 max-w-screen-2xl">
//         <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
//           <div>
//             <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
//               Quản lý sự kiện
//             </h1>
//             <p className="text-sm mt-1" style={{ color: '#64748b' }}>Quản lý và tổ chức các sự kiện của bạn</p>
//           </div>
//           <button onClick={() => navigate('/dashboard/events/new')}
//             className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
//             style={{ background: '#4f46e5' }}>
//             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
//             </svg>
//             Tạo sự kiện mới
//           </button>
//         </div>

//         {/* Filters */}
//         <div className="flex flex-wrap items-center gap-3 mb-6">
//           <div className="relative flex-1 min-w-[240px] max-w-sm">
//             <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
//               style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
//             </svg>
//             <input value={search} onChange={e => setSearch(e.target.value)}
//               placeholder="Tìm kiếm sự kiện..."
//               className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none bg-white transition-colors"
//               style={{ borderColor: '#e2e8f0' }} />
//           </div>
//           <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
//             {['all', 'open', 'nearly_full', 'full', 'ended'].map(status => (
//               <button key={status} onClick={() => setFilter(status)}
//                 className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
//                 style={{
//                   background: filter === status ? '#1e293b' : 'white',
//                   color: filter === status ? 'white' : '#475569',
//                   border: `1px solid ${filter === status ? '#1e293b' : '#e2e8f0'}`
//                 }}>
//                 {status === 'all' ? 'Tất cả' : getEventStatusLabel(status)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Desktop Table */}
//         <div className="hidden lg:block bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#f1f5f9' }}>
//           <table className="w-full text-sm text-left">
//             <thead>
//               <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
//                 <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Sự kiện</th>
//                 <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Thời gian</th>
//                 <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Đăng ký</th>
//                 <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Trạng thái</th>
//                 <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: '#64748b' }}>Thao tác</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y" style={{ divideColor: '#f1f5f9' }}>
//               {filteredEvents.map(event => {
//                 const sc = getEventStatusColors(event.status);
//                 const pct = Math.round((event.registered / event.capacity) * 100);
//                 return (
//                   <tr key={event.id} className="hover:bg-slate-50 transition-colors">
//                     <td className="px-5 py-4">
//                       <div className="font-semibold text-base mb-1" style={{ color: '#1a1a2e', fontFamily: 'var(--font-display)' }}>{event.title}</div>
//                       <div className="text-xs" style={{ color: '#64748b' }}>📍 {event.room}, {event.location}</div>
//                     </td>
//                     <td className="px-5 py-4">
//                       <div className="font-medium" style={{ color: '#475569' }}>{new Date(event.date).toLocaleDateString('vi-VN')}</div>
//                       <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{event.startTime} - {event.endTime}</div>
//                     </td>
//                     <td className="px-5 py-4">
//                       <div className="flex items-center gap-2 mb-1">
//                         <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>
//                           {event.registered}/{event.capacity}
//                         </span>
//                         <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#059669' }}>
//                           ({pct}%)
//                         </span>
//                       </div>
//                       <div className="w-24 h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
//                         <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#dc2626' : '#059669' }} />
//                       </div>
//                     </td>
//                     <td className="px-5 py-4">
//                       <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
//                         style={{ background: sc.bg, color: sc.text }}>
//                         {getEventStatusLabel(event.status)}
//                       </span>
//                     </td>
//                     <td className="px-5 py-4 text-right">
//                       <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Chỉnh sửa">
//                         <svg className="w-4 h-4" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                           <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
//                         </svg>
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Mobile Cards */}
//         <div className="lg:hidden space-y-4">
//           {filteredEvents.map(event => {
//             const sc = getEventStatusColors(event.status);
//             const pct = Math.round((event.registered / event.capacity) * 100);
//             return (
//               <div key={event.id} className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
//                 <div className="flex justify-between items-start mb-2">
//                   <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
//                     {getEventStatusLabel(event.status)}
//                   </span>
//                   <button className="p-1.5 rounded-lg hover:bg-slate-50">
//                     <svg className="w-4 h-4" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
//                     </svg>
//                   </button>
//                 </div>
//                 <h3 className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
//                   {event.title}
//                 </h3>
//                 <p className="text-xs mb-3" style={{ color: '#64748b' }}>
//                   {new Date(event.date).toLocaleDateString('vi-VN')} · {event.startTime} - {event.endTime}
//                 </p>
//                 <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: '#f1f5f9' }}>
//                   <div className="text-xs" style={{ color: '#64748b' }}>
//                     <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>{event.registered}</span>
//                     /{event.capacity} đăng ký
//                   </div>
//                   <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#059669' }}>
//                     {pct}%
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchOrganizerEvents, deleteEvent } from '../services/api';

// Hàm định dạng ngày DD/MM/YYYY không bị trôi múi giờ
const formatDate = (dateStr) => {
  if (!dateStr) return 'Chưa xác định';
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Hàm ánh xạ nhãn hiển thị cho trạng thái CSDL thực tế
const getStatusBadge = (status) => {
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
      return { label: status, bg: '#f1f5f9', text: '#475569' };
  }
};

export default function EventManagementPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // State quản lý Modal xác nhận xóa
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 1. Tải danh sách sự kiện từ Backend
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOrganizerEvents();
      if (res.success) {
        setEvents(res.data || []);
      } else {
        setError(res.message || 'Không thể tải danh sách sự kiện');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // 2. Xử lý xóa / hủy sự kiện
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await deleteEvent(deleteId);
      if (res.success) {
        setDeleteId(null);
        await loadEvents(); // Tải lại danh sách mới
      } else {
        alert(res.message || 'Không thể hủy sự kiện');
      }
    } catch (err) {
      alert(err.message || 'Đã xảy ra lỗi khi hủy sự kiện');
    } finally {
      setDeleting(false);
    }
  };

  // 3. Lọc sự kiện theo tìm kiếm và tab trạng thái
  const filteredEvents = events.filter((e) => {
    if (filter !== 'all' && e.trang_thai_su_kien !== filter) return false;
    if (search && !e.ten_su_kien?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
              Quản lý sự kiện
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Quản lý và tổ chức các sự kiện của bạn</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/events/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: '#4f46e5' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tạo sự kiện mới
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: '#94a3b8' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sự kiện..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none bg-white transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'BanNhap', label: 'Bản nháp' },
              { id: 'SapToChuc', label: 'Sắp diễn ra' },
              { id: 'DangDienRa', label: 'Đang diễn ra' },
              { id: 'DaKetThuc', label: 'Đã kết thúc' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  background: filter === tab.id ? '#1e293b' : 'white',
                  color: filter === tab.id ? 'white' : '#475569',
                  border: `1px solid ${filter === tab.id ? '#1e293b' : '#e2e8f0'}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trạng thái Loading / Error */}
        {loading && (
          <div className="py-12 text-center text-sm" style={{ color: '#64748b' }}>
            Đang tải dữ liệu sự kiện từ máy chủ...
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Desktop Table */}
        {!loading && !error && (
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#f1f5f9' }}>
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Sự kiện</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Thời gian</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Đăng ký</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Trạng thái</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: '#64748b' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: '#f1f5f9' }}>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                      Không tìm thấy sự kiện nào.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => {
                    const sc = getStatusBadge(event.trang_thai_su_kien);
                    const registered = event.so_ve_da_dat || 0;
                    const capacity = event.so_luong_toi_da || 1;
                    const pct = Math.min(100, Math.round((registered / capacity) * 100));

                    return (
                      <tr key={event.ma_su_kien} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-base mb-1" style={{ color: '#1a1a2e', fontFamily: 'var(--font-display)' }}>
                            {event.ten_su_kien}
                          </div>
                          <div className="text-xs" style={{ color: '#64748b' }}>
                            📍 {event.phong}, {event.dia_diem}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium" style={{ color: '#475569' }}>
                            {formatDate(event.ngay_dien_ra)}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                            {event.thoi_gian_bat_dau} - {event.thoi_gian_ket_thuc}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>
                              {registered}/{capacity}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#059669' }}>
                              ({pct}%)
                            </span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#dc2626' : '#059669' }} />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Nút sửa */}
                            <button
                              onClick={() => navigate(`/dashboard/events/edit/${event.ma_su_kien}`)}
                              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            {/* Nút xóa / hủy */}
                            <button
                              onClick={() => setDeleteId(event.ma_su_kien)}
                              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Hủy/Xóa sự kiện"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Cards */}
        {!loading && !error && (
          <div className="lg:hidden space-y-4">
            {filteredEvents.map((event) => {
              const sc = getStatusBadge(event.trang_thai_su_kien);
              const registered = event.so_ve_da_dat || 0;
              const capacity = event.so_luong_toi_da || 1;
              const pct = Math.min(100, Math.round((registered / capacity) * 100));

              return (
                <div key={event.ma_su_kien} className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                      {sc.label}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/dashboard/events/edit/${event.ma_su_kien}`)}
                        className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(event.ma_su_kien)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                    {event.ten_su_kien}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                    {formatDate(event.ngay_dien_ra)} · {event.thoi_gian_bat_dau} - {event.thoi_gian_ket_thuc}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: '#f1f5f9' }}>
                    <div className="text-xs" style={{ color: '#64748b' }}>
                      <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#1a1a2e' }}>{registered}</span>
                      /{capacity} đăng ký
                    </div>
                    <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#059669' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal xác nhận xóa sự kiện */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h3 className="font-bold text-lg text-slate-800 mb-2">Xác nhận hủy sự kiện</h3>
              <p className="text-sm text-slate-600 mb-6">
                Bạn có chắc chắn muốn hủy sự kiện này? Hành động này sẽ chuyển trạng thái sự kiện sang "Đã kết thúc".
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}