import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { MOCK_STAFF } from '../mocks/mockData';

const ACCOUNT_STATUS = {
  active: { bg: '#dcfce7', text: '#15803d', label: 'Đang hoạt động' },
  inactive: { bg: '#fef9c3', text: '#a16207', label: 'Chưa kích hoạt' },
  locked: { bg: '#fee2e2', text: '#b91c1c', label: 'Đã khóa' },
};

export default function StaffPage() {
  const [showModal, setShowModal] = useState(false);
  const [activationModal, setActivationModal] = useState(false);
  const [token, setToken] = useState('');

  function generateToken() {
    setToken('CEH-STAFF-' + Math.random().toString(36).slice(2, 6).toUpperCase());
    setActivationModal(true);
    setShowModal(false);
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ color: '#1a1a2e' }}>Quản lý nhân viên</h1>
            <p className="text-sm text-slate-500 mt-1">Phân quyền tài khoản nhân viên điểm danh</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600">
            Thêm nhân viên
          </button>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs">Nhân viên</th>
                <th className="px-4 py-3 font-semibold text-xs">Sự kiện phụ trách</th>
                <th className="px-4 py-3 font-semibold text-xs">Quyền</th>
                <th className="px-4 py-3 font-semibold text-xs">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STAFF.map(s => {
                const ss = ACCOUNT_STATUS[s.accountStatus];
                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-xs">{s.assignedEvent}</td>
                    <td className="px-4 py-4 text-slate-600 text-xs">{s.permission}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: ss.bg, color: ss.text }}>
                        {ss.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Thêm nhân viên</h2>
            <div className="space-y-4 mb-6">
              <input placeholder="Họ và tên" className="w-full px-3 py-2 border rounded-xl" />
              <input placeholder="Email" className="w-full px-3 py-2 border rounded-xl" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border">Hủy</button>
              <button onClick={generateToken} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white">Tạo mã kích hoạt</button>
            </div>
          </div>
        </div>
      )}

      {activationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center">
            <h2 className="font-bold text-lg mb-4">Mã kích hoạt</h2>
            <div className="bg-green-50 text-green-700 font-mono text-xl py-3 rounded-xl mb-4 font-bold tracking-widest">{token}</div>
            <button onClick={() => setActivationModal(false)} className="w-full py-2 rounded-xl bg-indigo-600 text-white">Đóng</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
