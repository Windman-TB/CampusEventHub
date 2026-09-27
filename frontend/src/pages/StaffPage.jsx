import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { MOCK_STAFF, MOCK_EVENTS } from '../mocks/mockData';

const ACCOUNT_STATUS = {
  active: { bg: '#dcfce7', text: '#15803d', label: 'Đang hoạt động' },
  inactive: { bg: '#fef9c3', text: '#a16207', label: 'Chưa kích hoạt' },
  locked: { bg: '#fee2e2', text: '#b91c1c', label: 'Đã khóa' },
};

// Dữ liệu danh sách sinh viên UIT mẫu để tìm kiếm/lọc theo MSSV
const SAMPLE_STUDENTS = [
  { mssv: '22521001', name: 'Nguyễn Văn An', email: '22521001@gm.uit.edu.vn', faculty: 'Khoa Công nghệ Thông tin' },
  { mssv: '22521002', name: 'Trần Thị Bích', email: '22521002@gm.uit.edu.vn', faculty: 'Khoa An toàn Thông tin' },
  { mssv: '22521003', name: 'Lê Minh Châu', email: '22521003@gm.uit.edu.vn', faculty: 'Khoa Khoa học Máy tính' },
  { mssv: '22521004', name: 'Phạm Quốc Dũng', email: '22521004@gm.uit.edu.vn', faculty: 'Khoa Mạng máy tính & TT' },
  { mssv: '22521005', name: 'Vũ Hoàng Giang', email: '22521005@gm.uit.edu.vn', faculty: 'Khoa Hệ thống Thông tin' },
  { mssv: '21520123', name: 'Đặng Tuấn Kiệt', email: '21520123@gm.uit.edu.vn', faculty: 'Khoa Kỹ thuật Máy tính' },
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState(
    MOCK_STAFF.map((s, idx) => ({
      ...s,
      mssv: s.mssv || `2252000${idx + 1}`,
    }))
  );

  const [searchTable, setSearchTable] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State khi thêm nhân viên
  const [mssvQuery, setMssvQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(MOCK_EVENTS[0]?.id || '');
  const [permission, setPermission] = useState('Điểm danh (Quét QR & Nhập mã)');

  // Lọc sinh viên theo MSSV khi gõ
  const studentSuggestions = mssvQuery.trim()
    ? SAMPLE_STUDENTS.filter(
        (s) =>
          s.mssv.includes(mssvQuery.trim()) ||
          s.name.toLowerCase().includes(mssvQuery.toLowerCase())
      )
    : [];

  function handleSelectStudent(student) {
    setSelectedStudent(student);
    setMssvQuery(student.mssv);
  }

  function handleAddStaff(e) {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Vui lòng chọn một sinh viên hợp lệ từ danh sách tìm kiếm MSSV!');
      return;
    }
    if (!selectedEventId) {
      alert('Vui lòng chọn sự kiện phân công!');
      return;
    }

    const assignedEvent = MOCK_EVENTS.find((ev) => ev.id === selectedEventId);

    // Kiểm tra xem sinh viên đã được phân công cho sự kiện này chưa
    const isAlreadyAssigned = staffList.some(
      (s) => s.email === selectedStudent.email && s.assignedEvent === assignedEvent?.title
    );
    if (isAlreadyAssigned) {
      alert(`Sinh viên ${selectedStudent.name} (${selectedStudent.mssv}) đã được phân công sự kiện này rồi!`);
      return;
    }

    const newStaffEntry = {
      id: `s-${Date.now()}`,
      name: selectedStudent.name,
      mssv: selectedStudent.mssv,
      email: selectedStudent.email,
      assignedEvent: assignedEvent?.title || 'Sự kiện chưa xác định',
      permission: permission,
      accountStatus: 'active',
      lastActive: 'Vừa cấp quyền',
    };

    setStaffList([newStaffEntry, ...staffList]);
    setShowAddModal(false);
    setSelectedStudent(null);
    setMssvQuery('');

    // Hiển thị Toast thông báo
    setToastMessage(`Đã cấp quyền điểm danh thành công cho sinh viên ${newStaffEntry.name} (${newStaffEntry.mssv})!`);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function handleRevokeStaff(id, name) {
    if (window.confirm(`Bạn có chắc chắn muốn thu hồi quyền điểm danh của nhân viên "${name}" không?`)) {
      setStaffList(staffList.filter((s) => s.id !== id));
      setToastMessage(`Đã thu hồi quyền của nhân viên "${name}".`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }

  // Lọc bảng danh sách nhân viên
  const filteredStaff = staffList.filter((s) => {
    const q = searchTable.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.mssv && s.mssv.includes(q)) ||
      s.email.toLowerCase().includes(q) ||
      s.assignedEvent.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        {/* Toast thông báo */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/20 text-sm font-semibold animate-fade-in">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tiêu đề & Nút Thêm nhân viên */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ color: '#1a1a2e', fontFamily: 'var(--font-display)' }}>
              Quản lý nhân viên điểm danh
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Phân quyền cho sinh viên cộng tác viên trực tiếp quét mã check-in theo từng sự kiện
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              setSelectedStudent(null);
              setMssvQuery('');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm nhân viên
          </button>
        </div>

        {/* Thanh tìm kiếm & Thống kê nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="relative min-w-[280px] max-w-md flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Tìm theo MSSV, tên nhân viên, sự kiện..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-indigo-600 transition-colors shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Tổng số: <strong className="text-slate-800 font-bold">{staffList.length}</strong> nhân viên</span>
          </div>
        </div>

        {/* Bảng danh sách nhân viên */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Nhân viên / Sinh viên</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Sự kiện phụ trách</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Quyền hạn</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                      Không tìm thấy nhân viên nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => {
                    const ss = ACCOUNT_STATUS[s.accountStatus] || ACCOUNT_STATUS.active;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            {s.mssv && (
                              <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                {s.mssv}
                              </span>
                            )}
                            <span>{s.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-800 text-sm">{s.assignedEvent}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700">
                            <span>📷</span> {s.permission}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ background: ss.bg, color: ss.text }}
                          >
                            {ss.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleRevokeStaff(s.id, s.name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                            title="Thu hồi quyền check-in"
                          >
                            Hủy quyền
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Thêm nhân viên điểm danh (Lọc MSSV & Chọn sự kiện) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-xl text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                  Cấp quyền nhân viên điểm danh
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lọc sinh viên theo MSSV và chọn sự kiện cần phân công
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-5">
              {/* Bước 1: Lọc theo MSSV */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  1. Tìm kiếm sinh viên theo MSSV <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập MSSV (ví dụ: 22521001) hoặc tên..."
                    value={mssvQuery}
                    onChange={(e) => {
                      setMssvQuery(e.target.value);
                      if (selectedStudent && e.target.value !== selectedStudent.mssv) {
                        setSelectedStudent(null);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  {mssvQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setMssvQuery('');
                        setSelectedStudent(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Danh sách gợi ý khi tìm kiếm */}
                {!selectedStudent && studentSuggestions.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {studentSuggestions.map((stu) => (
                      <div
                        key={stu.mssv}
                        onClick={() => handleSelectStudent(stu)}
                        className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{stu.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{stu.faculty}</div>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                          {stu.mssv}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card hiển thị sinh viên đã được chọn */}
                {selectedStudent && (
                  <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                          {selectedStudent.name}
                          <span className="text-xs font-normal font-mono px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                            {selectedStudent.mssv}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-700 mt-0.5">{selectedStudent.email} · {selectedStudent.faculty}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-200/60 text-emerald-800 rounded-lg whitespace-nowrap">
                      ✓ Đã chọn
                    </span>
                  </div>
                )}
              </div>

              {/* Bước 2: Chọn Sự kiện tương ứng */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  2. Chọn Sự kiện phân công soát vé <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium bg-white"
                >
                  {MOCK_EVENTS.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} (Ngày: {new Date(ev.date).toLocaleDateString('vi-VN')} · {ev.room})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bước 3: Quyền hạn */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  3. Quyền hạn nhân viên
                </label>
                <div className="space-y-2">
                  {[
                    'Điểm danh (Quét QR & Nhập mã)',
                    'Điểm danh + Xem danh sách người tham gia',
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
                  disabled={!selectedStudent}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all"
                >
                  Xác nhận cấp quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
