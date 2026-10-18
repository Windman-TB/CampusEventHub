import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchOrganizerEvents } from '../services/api';
import {
  fetchStaff,
  searchStudents,
  addStaff,
  revokeStaff,
} from '../services/staff.api';

// Date-only từ CSDL: không chuyển timezone khi hiển thị.
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('T')[0].split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(dateStr);
}

const SCAN_PERMISSION = 'Điểm danh (Quét mã QR & Nhập mã thủ công)';

export default function StaffPage() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchTable, setSearchTable] = useState('');

  // Gắn mỗi kết quả với eventId và phiên tải, tránh hiển thị nhân viên sự kiện cũ.
  const [staffVersion, setStaffVersion] = useState(0);
  const [staffResult, setStaffResult] = useState({ key: '', items: [], error: '' });
  const currentStaffKey = `${selectedEventId}:${staffVersion}`;
  const staffList = staffResult.key === currentStaffKey ? staffResult.items : [];
  const loadingStaff = Boolean(selectedEventId) && staffResult.key !== currentStaffKey;

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalEventId, setModalEventId] = useState('');
  const [mssvQuery, setMssvQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLookup, setStudentLookup] = useState({ query: '', items: [], error: '' });
  const [permission, setPermission] = useState(SCAN_PERMISSION);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [revokingStaffId, setRevokingStaffId] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [toast, setToast] = useState(null);

  const normalizedQuery = mssvQuery.trim();
  const studentSuggestions =
    !selectedStudent && normalizedQuery.length >= 2 && studentLookup.query === normalizedQuery
      ? studentLookup.items
      : [];
  const searchingStudents =
    showAddModal && !selectedStudent && normalizedQuery.length >= 2 &&
    studentLookup.query !== normalizedQuery;

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  // Hủy timer cũ khi có toast mới; cleanup khi rời trang.
  useEffect(() => {
    if (!toast) return undefined;
    const timerId = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timerId);
  }, [toast]);

  // Không setState đồng bộ trong effect; chỉ cập nhật sau khi API hoàn tất.
  useEffect(() => {
    let active = true;

    fetchOrganizerEvents()
      .then((res) => {
        if (!active) return;
        if (res?.success === false) {
          throw new Error(res.message || 'Không thể tải danh sách sự kiện');
        }
        const list = Array.isArray(res?.data) ? res.data : [];
        setEvents(list);
        setSelectedEventId((previous) =>
          list.some((event) => String(event.ma_su_kien) === String(previous))
            ? previous
            : list.length > 0 ? String(list[0].ma_su_kien) : ''
        );
      })
      .catch((err) => {
        if (active) setToast({
          message: err.message || 'Không thể tải danh sách sự kiện',
          type: 'error',
        });
      })
      .finally(() => {
        if (active) setLoadingEvents(false);
      });

    return () => { active = false; };
  }, []);

  // Nếu chọn sự kiện khác hoặc component unmount, bỏ qua response cũ.
  useEffect(() => {
    if (!selectedEventId) return undefined;
    let active = true;
    const key = `${selectedEventId}:${staffVersion}`;

    fetchStaff(selectedEventId)
      .then((res) => {
        if (!active) return;
        if (res?.success === false) {
          throw new Error(res.message || 'Không thể tải danh sách nhân viên');
        }
        setStaffResult({
          key,
          items: Array.isArray(res?.data) ? res.data : [],
          error: '',
        });
      })
      .catch((err) => {
        if (!active) return;
        const message = err.message || 'Không thể tải danh sách nhân viên';
        setStaffResult({ key, items: [], error: message });
        setToast({ message, type: 'error' });
      });

    return () => { active = false; };
  }, [selectedEventId, staffVersion]);

  // Debounce 300ms, tự loại bỏ kết quả tìm kiếm đã lỗi thời.
  useEffect(() => {
    if (!showAddModal || selectedStudent || normalizedQuery.length < 2) {
      return undefined;
    }

    let active = true;
    const timerId = setTimeout(() => {
      searchStudents(normalizedQuery)
        .then((res) => {
          if (!active) return;
          if (res?.success === false) {
            throw new Error(res.message || 'Không thể tìm kiếm sinh viên');
          }
          setStudentLookup({
            query: normalizedQuery,
            items: Array.isArray(res?.data) ? res.data : [],
            error: '',
          });
        })
        .catch((err) => {
          if (active) setStudentLookup({
            query: normalizedQuery,
            items: [],
            error: err.message || 'Không thể tìm kiếm sinh viên',
          });
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [showAddModal, selectedStudent, normalizedQuery]);

  function openAddModal() {
    setModalEventId(selectedEventId || (events[0] ? String(events[0].ma_su_kien) : ''));
    setSelectedStudent(null);
    setMssvQuery('');
    setStudentLookup({ query: '', items: [], error: '' });
    setPermission(SCAN_PERMISSION);
    setModalError(null);
    setShowAddModal(true);
  }

  function handleQueryChange(e) {
    setMssvQuery(e.target.value);
    setSelectedStudent(null);
    setModalError(null);
  }

  function handleSelectStudent(student) {
    setSelectedStudent(student);
    setMssvQuery(student.mssv || student.ho_ten || '');
    setStudentLookup({ query: '', items: [], error: '' });
  }

  async function handleAddStaff(e) {
    e.preventDefault();
    if (submittingStaff) return;
    if (!selectedStudent) {
      const message = 'Vui lòng chọn một sinh viên từ kết quả tìm kiếm!';
      setModalError(message);
      showToast(message, 'error');
      return;
    }

    const targetEventId = String(modalEventId || selectedEventId);
    if (!targetEventId) {
      const message = 'Vui lòng chọn sự kiện phân công!';
      setModalError(message);
      showToast(message, 'error');
      return;
    }

    setSubmittingStaff(true);
    setModalError(null);
    try {
      const res = await addStaff(targetEventId, selectedStudent.ma_tai_khoan);
      if (res?.success === false) {
        throw new Error(res.message || 'Không thể cấp quyền nhân viên');
      }
      showToast(res?.message || `Đã phân công ${selectedStudent.ho_ten} thành công!`);
      setShowAddModal(false);
      setSelectedStudent(null);
      setMssvQuery('');
      setStudentLookup({ query: '', items: [], error: '' });

      // Tải lại để nhận đúng dữ liệu từ DB; không sửa danh sách sự kiện khác.
      if (targetEventId === selectedEventId) {
        setStaffVersion((version) => version + 1);
      } else {
        setSelectedEventId(targetEventId);
      }
    } catch (err) {
      const message = err.message || 'Lỗi khi cấp quyền nhân viên';
      setModalError(message);
      showToast(message, 'error');
    } finally {
      setSubmittingStaff(false);
    }
  }

  async function handleRevokeStaff(staffId, staffName) {
    if (!selectedEventId || revokingStaffId !== null) return;
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền soát vé của nhân viên "${staffName}" không?`)) {
      return;
    }

    const eventIdAtAction = selectedEventId;
    setRevokingStaffId(staffId);
    try {
      const res = await revokeStaff(eventIdAtAction, staffId);
      if (res?.success === false) {
        throw new Error(res.message || 'Không thể thu hồi quyền nhân viên');
      }
      showToast(`Đã thu hồi quyền của nhân viên "${staffName}" thành công.`);
      setStaffVersion((version) => version + 1);
    } catch (err) {
      showToast(err.message || 'Không thể thu hồi quyền nhân viên', 'error');
    } finally {
      setRevokingStaffId(null);
    }
  }

  const normalizedTableSearch = searchTable.toLowerCase().trim();
  const filteredStaff = staffList.filter((staff) =>
    !normalizedTableSearch || [staff.ho_ten, staff.mssv, staff.email, staff.khoa]
      .some((value) => String(value ?? '').toLowerCase().includes(normalizedTableSearch))
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        {/* Toast thông báo (z-[9999] để luôn nổi lên trên cùng, trước cả Modal Backdrop) */}
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
        {/* Tiêu đề & Nút Thêm nhân viên */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1
              className="font-bold text-2xl text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Quản lý nhân viên soát vé
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Phân quyền cho sinh viên cộng tác viên trực tiếp quét mã QR và check-in vé theo từng sự kiện
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={events.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Phân công nhân viên mới
          </button>
        </div>
        {/* Bộ chọn Sự kiện & Tìm kiếm */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Dropdown chọn sự kiện */}
            <div className="min-w-[260px] max-w-md">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                CHỌN SỰ KIỆN ĐỂ QUẢN LÝ
              </label>
              {loadingEvents ? (
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ) : events.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">Bạn chưa có sự kiện nào</div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                >
                  {events.map((ev) => (
                    <option key={ev.ma_su_kien} value={ev.ma_su_kien}>
                      {ev.ten_su_kien} ({formatDate(ev.ngay_dien_ra)})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* Input tìm kiếm nhanh trong bảng */}
            <div className="relative min-w-[240px] max-w-sm flex-1 pt-4 sm:pt-5">
              <svg
                className="absolute left-3.5 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400"
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
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Tìm MSSV, tên nhân viên..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-indigo-600 transition-colors shadow-sm"
              />
            </div>
          </div>
          <div className="pt-4 sm:pt-5">
            <span className="text-xs text-slate-500 font-medium">
              Đang phân công:{' '}
              <strong className="text-slate-800 font-bold">{staffList.length}</strong> nhân viên
            </span>
          </div>
        </div>
        {staffResult.key === currentStaffKey && staffResult.error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {staffResult.error}
              <button type="button" className="ml-3 font-semibold underline" onClick={() => setStaffVersion((v) => v + 1)}>
                Thử lại
              </button>
            </div>
          )}
          {/* Bảng danh sách nhân viên */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Nhân viên / Sinh viên</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Khoa</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Thời gian phân công</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Quyền hạn</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingStaff ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh sách nhân viên...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      {selectedEventId
                        ? (staffResult.key === currentStaffKey && staffResult.error ? 'Danh sách chưa tải được.' : 'Chưa có nhân viên nào được phân công cho sự kiện này')
                        : 'Vui lòng chọn sự kiện để xem danh sách nhân viên'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => (
                    <tr key={s.ma_nhan_vien} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{s.ho_ten}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          {s.mssv && (
                            <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {s.mssv}
                            </span>
                          )}
                          <span>{s.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {s.khoa || 'Chưa cập nhật'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {s.thoi_gian_tao? new Date(s.thoi_gian_tao).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh',}): '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                          <span>📷</span> Soát vé & Quét QR
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevokeStaff(s.ma_nhan_vien, s.ho_ten)}
                          disabled={revokingStaffId !== null || loadingStaff}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                          title="Thu hồi quyền soát vé"
                        >
                          {revokingStaffId === s.ma_nhan_vien ? 'Đang thu hồi...' : 'Hủy quyền'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal: Thêm nhân viên điểm danh (Lọc MSSV từ Database & Chọn sự kiện) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2
                  className="font-bold text-xl text-slate-900"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Phân công nhân viên soát vé
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tìm kiếm tài khoản sinh viên theo MSSV/họ tên và chọn sự kiện phân công
                </p>
              </div>
              <button
                type="button"
                disabled={submittingStaff}
                onClick={() => {
                  setShowAddModal(false);
                  setModalError(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Thông báo lỗi trực tiếp nổi bật ngay trong Modal */}
            {modalError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-sm font-semibold animate-fade-in shadow-sm">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span>{modalError}</span>
              </div>
            )}
            <form onSubmit={handleAddStaff} className="space-y-5">
              {/* Bước 1: Chọn Sự kiện */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  1. Chọn Sự kiện phân công <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modalEventId}
                  onChange={(e) => setModalEventId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium bg-white"
                >
                  {events.map((ev) => (
                    <option key={ev.ma_su_kien} value={ev.ma_su_kien}>
                      {ev.ten_su_kien} (Ngày: {formatDate(ev.ngay_dien_ra)})
                    </option>
                  ))}
                </select>
              </div>
              {/* Bước 2: Tìm kiếm theo MSSV */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  2. Tìm kiếm sinh viên theo MSSV hoặc họ tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập MSSV (vd: 22521001) hoặc họ tên..."
                    value={mssvQuery}
                    onChange={handleQueryChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  {searchingStudents && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600 animate-pulse">
                      Đang tìm...
                    </div>
                  )}
                  {mssvQuery && !searchingStudents && (
                    <button
                      type="button"
                      onClick={() => {
                        setMssvQuery('');
                        setSelectedStudent(null);
                        setStudentLookup({ query: '', items: [], error: '' });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                {studentLookup.query === normalizedQuery && studentLookup.error && !selectedStudent && (
                  <p className="mt-2 text-xs text-rose-600">{studentLookup.error}</p>
                )}
                {normalizedQuery.length >= 2 && !searchingStudents && !selectedStudent &&
                  studentLookup.query === normalizedQuery && !studentLookup.error && studentSuggestions.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">Không tìm thấy tài khoản phù hợp.</p>
                  )}
                {/* Danh sách gợi ý từ DB */}
                {!selectedStudent && studentSuggestions.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {studentSuggestions.map((stu) => (
                      <button
                        key={stu.ma_tai_khoan}
                        type="button"
                        onClick={() => handleSelectStudent(stu)}
                        className="w-full text-left p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between focus-visible:outline-2 focus-visible:outline-indigo-500"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{stu.ho_ten}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {stu.email} {stu.khoa ? `· ${stu.khoa}` : ''}
                          </div>
                        </div>
                        {stu.mssv && (
                          <span className="font-mono text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                            {stu.mssv}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {/* Card hiển thị sinh viên đã được chọn */}
                {selectedStudent && (
                  <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {selectedStudent.ho_ten ? selectedStudent.ho_ten.charAt(0) : 'S'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                          {selectedStudent.ho_ten}
                          {selectedStudent.mssv && (
                            <span className="text-xs font-normal font-mono px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                              {selectedStudent.mssv}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-emerald-700 mt-0.5">
                          {selectedStudent.email} {selectedStudent.khoa ? `· ${selectedStudent.khoa}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-200/60 text-emerald-800 rounded-lg whitespace-nowrap">
                      ✓ Đã chọn
                    </span>
                  </div>
                )}
              </div>
              {/* Bước 3: Quyền hạn */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  3. Quyền hạn nhân viên
                </label>
                <div className="space-y-2">
                  {[
                    'Điểm danh (Quét mã QR & Nhập mã thủ công)',
                  ].map((perm) => (
                    <label
                      key={perm}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        permission === perm
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="permission_choice"
                        checked={permission === perm}
                        onChange={() => setPermission(perm)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Nút hành động */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submittingStaff}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudent || !modalEventId || submittingStaff}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all"
                >
                  {submittingStaff ? 'Đang cấp quyền...' : 'Xác nhận cấp quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
