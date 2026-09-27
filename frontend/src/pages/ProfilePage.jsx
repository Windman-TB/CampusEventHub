import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Giả lập thông tin user
  const [user, setUser] = useState({
    name: 'Nguyễn Văn A',
    studentId: '2252xxxx',
    faculty: 'Công nghệ Thông tin',
    email: '2252xxxx@gm.uit.edu.vn',
    phone: '0901234567',
    role: 'Sinh viên',
    initials: 'SV',
    avatar: null,
  });

  const [draft, setDraft] = useState({ name: user.name, phone: user.phone });

  function handleSave() {
    setUser({ ...user, name: draft.name, phone: draft.phone });
    setEditMode(false);
    alert('Đã cập nhật hồ sơ thành công.');
  }

  function handleCancel() {
    setDraft({ name: user.name, phone: user.phone });
    setEditMode(false);
  }

  return (
    <MainLayout>
      <div className="bg-white shadow-sm px-4 pb-6 pt-6">
        <h1 className="font-bold text-xl mb-5 text-slate-900">Hồ sơ cá nhân</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}>
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.initials}
            </div>
            <button onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white bg-indigo-600">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              </svg>
            </button>
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.role} · {user.faculty}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Tài khoản đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          ['12', 'Vé đã đặt'],
          ['8', 'Đã tham dự'],
          ['80 điểm', 'Rèn luyện'],
        ].map(([v, l]) => (
          <div key={l} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <div className="font-bold text-lg text-indigo-600">{v}</div>
            <div className="text-xs mt-0.5 leading-tight text-slate-400">{l}</div>
          </div>
        ))}
      </div>

      {/* Info form */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="px-4 py-3.5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Thông tin sinh viên</h3>
            {!editMode && (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>

          {[
            { label: 'Họ và tên', value: user.name, editable: true, key: 'name' },
            { label: 'MSSV', value: user.studentId, editable: false },
            { label: 'Khoa / Viện', value: user.faculty, editable: false },
            { label: 'Email sinh viên', value: user.email, editable: false },
            { label: 'Số điện thoại', value: user.phone, editable: true, key: 'phone' },
            { label: 'Vai trò', value: user.role, editable: false },
          ].map(({ label, value, editable, key }) => (
            <div key={label} className="px-4 py-3 border-b border-slate-50 last:border-0">
              <label className="block text-xs font-medium mb-1 text-slate-400">{label}</label>
              {editMode && editable && key ? (
                <input
                  value={draft[key]}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  className="w-full text-sm font-medium bg-transparent outline-none border-b border-indigo-600 pb-1 text-slate-900"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 mt-4 space-y-3 mb-6">
        {editMode ? (
          <>
            <button onClick={handleSave}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Lưu thay đổi
            </button>
            <button onClick={handleCancel}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
              Hủy
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-red-50 text-red-700 hover:bg-red-100">
            Đăng xuất
          </button>
        )}
      </div>

      {/* Avatar modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">Thay đổi ảnh đại diện</h3>
              <button onClick={() => setShowAvatarModal(false)}>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-3xl text-white"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}>
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.initials}
              </div>
            </div>
            
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 hover:bg-slate-50">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Chọn ảnh từ thư viện
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 hover:bg-slate-50">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                </svg>
                Chụp ảnh
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={() => { setUser({ ...user, avatar: null }); setShowAvatarModal(false); }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Xóa ảnh hiện tại
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAvatarModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                Hủy
              </button>
              <button onClick={() => { setShowAvatarModal(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
                Lưu ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
