import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchOrganizerEvents } from '../services/api';
import {
  fetchStaff,
  searchStudents,
  addStaff,
  revokeStaff,
} from '../services/staff.api';

const ACCOUNT_STATUS = {
  HoatDong: { bg: '#dcfce7', text: '#15803d', label: 'Đang hoạt động' },
  Khoa: { bg: '#fee2e2', text: '#b91c1c', label: 'Đã khóa' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
};

export default function StaffPage() {
  // Danh sách sự kiện của BTC
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Danh sách nhân viên của sự kiện đang chọn
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchTable, setSearchTable] = useState('');

  // Modal Thêm nhân viên
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalEventId, setModalEventId] = useState('');
  const [mssvQuery, setMssvQuery] = useState('');
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [permission, setPermission] = useState('Điểm danh (Quét QR & Nhập mã)');
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const debounceTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Tải danh sách sự kiện của BTC
  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);
      try {
        const res = await fetchOrganizerEvents();
        const list = res.data || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(String(list[0].ma_su_kien));
        }
      } catch (err) {
        showToast(err.message || 'Không thể tải danh sách sự kiện', 'error');
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  // 2. Tải danh sách staff của sự kiện được chọn
  const loadStaffForEvent = useCallback(async (eventId) => {
    if (!eventId) {
      setStaffList([]);
      return;
    }
    setLoadingStaff(true);
    try {
      const res = await fetchStaff(eventId);
      setStaffList(res.data || []);
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách nhân viên', 'error');
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadStaffForEvent(selectedEventId);
    }
  }, [selectedEventId, loadStaffForEvent]);

  // 3. Tìm kiếm sinh viên theo MSSV với debounce 300ms
  useEffect(() => {
    if (!mssvQuery || mssvQuery.trim().length < 2) {
      setStudentSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await searchStudents(mssvQuery.trim());
        setStudentSuggestions(res.data || []);
      } catch {
        setStudentSuggestions([]);
      } finally {
        setSearchingStudents(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [mssvQuery]);

  function handleSelectStudent(student) {
    setSelectedStudent(student);
    setMssvQuery(student.mssv || student.ho_ten);
    setStudentSuggestions([]);
  }

  // 4. Thêm nhân viên soát vé
  async function handleAddStaff(e) {
    e.preventDefault();
    if (!selectedStudent) {
      const msg = 'Vui lòng chọn một sinh viên từ kết quả tìm kiếm!';
      setModalError(msg);
      showToast(msg, 'error');
      return;
    }
    const targetEventId = modalEventId || selectedEventId;
    if (!targetEventId) {
      const msg = 'Vui lòng chọn sự kiện phân công!';
      setModalError(msg);
      showToast(msg, 'error');
      return;
    }

    setSubmittingStaff(true);
    setModalError(null);
    try {
      const res = await addStaff(targetEventId, selectedStudent.ma_tai_khoan);
      showToast(res.message || `Đã phân công ${selectedStudent.ho_ten} thành công!`);

      setShowAddModal(false);
      setSelectedStudent(null);
      setMssvQuery('');
      setStudentSuggestions([]);
      setModalError(null);

      // Nếu thêm vào sự kiện hiện tại, refetch danh sách staff
      if (String(targetEventId) === String(selectedEventId)) {
        loadStaffForEvent(selectedEventId);
      } else {
        setSelectedEventId(String(targetEventId));
      }
    } catch (err) {
      const errMsg = err.message || 'Lỗi khi cấp quyền nhân viên';
      setModalError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmittingStaff(false);
    }
  }

  // 5. Thu hồi quyền soát vé
  async function handleRevokeStaff(staffId, staffName) {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn thu hồi quyền soát vé của nhân viên "${staffName}" không?`
      )
    ) {
      return;
    }

    try {
      await revokeStaff(selectedEventId, staffId);
      showToast(`Đã thu hồi quyền của nhân viên "${staffName}" thành công.`);
      setStaffList((prev) => prev.filter((s) => s.ma_nhan_vien !== staffId));
    } catch (err) {
      showToast(err.message || 'Không thể thu hồi quyền nhân viên', 'error');
    }
  }

  // Lọc bảng theo từ khóa tìm kiếm nhanh
  const filteredStaff = staffList.filter((s) => {
    const q = searchTable.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.ho_ten && s.ho_ten.toLowerCase().includes(q)) ||
      (s.mssv && s.mssv.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.khoa && s.khoa.toLowerCase().includes(q))
    );
  });

  const selectedEventObj = events.find((e) => String(e.ma_su_kien) === String(selectedEventId));

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
            onClick={() => {
              setModalEventId(selectedEventId || (events[0]?.ma_su_kien ? String(events[0].ma_su_kien) : ''));
              setSelectedStudent(null);
              setMssvQuery('');
              setStudentSuggestions([]);
              setModalError(null);
              setShowAddModal(true);
            }}
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
                        ? 'Chưa có nhân viên nào được phân công cho sự kiện này'
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
                        {s.thoi_gian_tao ? new Date(s.thoi_gian_tao).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                          <span>📷</span> Soát vé & Quét QR
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleRevokeStaff(s.ma_nhan_vien, s.ho_ten)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors shadow-sm"
                          title="Thu hồi quyền soát vé"
                        >
                          Hủy quyền
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
                    onChange={(e) => {
                      setMssvQuery(e.target.value);
                      if (selectedStudent && e.target.value !== (selectedStudent.mssv || selectedStudent.ho_ten)) {
                        setSelectedStudent(null);
                      }
                    }}
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
                        setStudentSuggestions([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Danh sách gợi ý từ DB */}
                {!selectedStudent && studentSuggestions.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {studentSuggestions.map((stu) => (
                      <div
                        key={stu.ma_tai_khoan}
                        onClick={() => handleSelectStudent(stu)}
                        className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between"
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
                      </div>
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
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudent || submittingStaff}
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
