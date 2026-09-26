import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-indigo-600/30">
          🎓
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Campus Event Hub</h1>
        <p className="text-sm text-slate-500 mb-8">Nền tảng quản lý sự kiện đại học</p>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold transition-all hover:bg-indigo-100">
            Đăng nhập với tư cách Sinh viên
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 shadow-md shadow-indigo-600/20">
            Đăng nhập Ban tổ chức (Organizer)
          </button>
          <button 
            onClick={() => navigate('/check-in')} 
            className="w-full py-3.5 border-2 border-slate-200 text-slate-600 rounded-xl font-bold transition-all hover:border-slate-300 hover:bg-slate-50">
            Truy cập máy quét điểm danh (Staff)
          </button>
        </div>
      </div>
    </div>
  );
}
