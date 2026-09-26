import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="bg-white px-4 pt-6 pb-6 shadow-sm">
        <h1 className="font-bold text-xl mb-6 text-slate-900">Cá nhân</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
            SV
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Nguyễn Văn A</h2>
            <p className="text-sm text-slate-500">2252xxxx · Khoa CNTT</p>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => alert("Tính năng đang phát triển")} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            <span>Thông tin cá nhân</span>
            <span>›</span>
          </button>
          <button onClick={() => alert("Tính năng đang phát triển")} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            <span>Lịch sử điểm danh</span>
            <span>›</span>
          </button>
          <button onClick={() => alert("Tính năng đang phát triển")} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            <span>Cài đặt thông báo</span>
            <span>›</span>
          </button>
          
          <button onClick={() => navigate('/login')} className="w-full mt-4 bg-red-50 border border-red-100 p-4 rounded-2xl flex justify-center items-center text-sm font-bold text-red-600">
            Đăng xuất
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
