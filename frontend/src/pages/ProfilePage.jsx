import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout, { clearStoredRole } from '../layouts/MainLayout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, attended: 0, points: 0 });

  const [user, setUser] = useState({
    name: '',
    studentId: '',
    faculty: '',
    email: '',
    phone: '',
    role: '',
    initials: '',
    avatar: null,
  });

  const [draft, setDraft] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Fetch profile
      const resProfile = await fetch(`${apiUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataProfile = await resProfile.json();
      
      if (dataProfile.success) {
        const u = dataProfile.data;
        const mappedUser = {
          name: u.ho_ten || '',
          studentId: u.mssv || '',
          faculty: u.khoa || 'Chưa cập nhật',
          email: u.email || '',
          phone: u.sdt || '',
          role: u.loai_tai_khoan === 'SinhVien' ? 'Sinh viên' : u.loai_tai_khoan === 'ToChuc' ? 'Ban tổ chức' : 'Quản trị viên',
          initials: (u.ho_ten || 'A').charAt(0).toUpperCase(),
          avatar: u.avatar_url,
        };
        setUser(mappedUser);
        setDraft({ name: mappedUser.name, phone: mappedUser.phone });
      }

      // Fetch tickets to calculate stats
      const resTickets = await fetch(`${apiUrl}/api/tickets/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataTickets = await resTickets.json();
      if (dataTickets.success) {
        const tickets = dataTickets.data || [];
        const total = tickets.length;
        const attended = tickets.filter(t => t.trang_thai_ve === 'DaCheckIn').length;
        // Điểm rèn luyện giả định = số vé tham dự * 10
        setStats({ total, attended, points: attended * 10 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function handleSave() {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ho_ten: draft.name,
          sdt: draft.phone
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, name: draft.name, phone: draft.phone });
        setEditMode(false);
        // Cập nhật lại localStorage để các chỗ khác nhận tên mới
        localStorage.setItem('user', JSON.stringify({
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          ho_ten: draft.name,
          sdt: draft.phone
        }));
        alert('Đã cập nhật hồ sơ thành công.');
      } else {
        alert(data.message || 'Lỗi khi cập nhật hồ sơ');
      }
    } catch (err) {
      alert('Lỗi khi cập nhật hồ sơ');
    }
  }

  function handleCancel() {
    setDraft({ name: user.name, phone: user.phone });
    setEditMode(false);
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-gray-500">Đang tải hồ sơ...</div>
      </MainLayout>
    );
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
          [stats.total, 'Vé đã đặt'],
          [stats.attended, 'Đã tham dự'],
          [stats.points + ' điểm', 'Rèn luyện'],
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
          <button
            onClick={() => {
              sessionStorage.clear();
              localStorage.clear();
              clearStoredRole(); 
              navigate('/login'); 
            }}
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
              <h3 className="font-bold text-base text-slate-900">Tính năng đang phát triển</h3>
              <button onClick={() => setShowAvatarModal(false)}>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Tính năng cập nhật ảnh đại diện sẽ được hỗ trợ trong các phiên bản sau.</p>
            <button onClick={() => setShowAvatarModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
              Đóng
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
