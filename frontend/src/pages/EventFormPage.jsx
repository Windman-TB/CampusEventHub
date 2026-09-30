// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import DashboardLayout from '../layouts/DashboardLayout';

// function Field({ label, type = 'text', placeholder, value, onChange, required = false, type2 = 'input', options = [] }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
//         {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
//       </label>
//       {type2 === 'textarea' ? (
//         <textarea rows={4} value={value} onChange={onChange} placeholder={placeholder}
//           className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
//           style={{ borderColor: '#e2e8f0' }} />
//       ) : type2 === 'select' ? (
//         <select value={value} onChange={onChange}
//           className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
//           style={{ borderColor: '#e2e8f0' }}>
//           {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//         </select>
//       ) : (
//         <input type={type} value={value} onChange={onChange} placeholder={placeholder}
//           className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
//           style={{ borderColor: '#e2e8f0' }} />
//       )}
//     </div>
//   );
// }

// export default function EventFormPage() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     title: '', topic: 'academic', date: '', startTime: '', endTime: '', location: '', room: '', capacity: 100, speaker: '', description: ''
//   });

//   return (
//     <DashboardLayout>
//       <div className="p-6 lg:p-8 max-w-screen-2xl">
//         <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//           <div className="flex items-center gap-3">
//             <button onClick={() => navigate('/dashboard/events')}
//               className="p-2 rounded-xl border hover:bg-slate-50 transition-colors"
//               style={{ borderColor: '#e2e8f0', color: '#475569' }}>
//               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//               </svg>
//             </button>
//             <div>
//               <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
//                 Tạo sự kiện mới
//               </h1>
//             </div>
//           </div>
//           <div className="flex gap-3">
//             <button className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-white"
//               style={{ borderColor: '#e2e8f0', color: '#475569' }}>Lưu nháp</button>
//             <button className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
//               style={{ background: '#4f46e5' }}>Xuất bản sự kiện</button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-2 space-y-6">
//             <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
//               <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
//                 Thông tin chung
//               </h2>
//               <div className="space-y-4">
//                 <Field label="Tên sự kiện" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Vd: Hội thảo AI 2026..." />
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Field label="Chủ đề" required type2="select" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })}
//                     options={[{ label: 'Học thuật', value: 'academic' }, { label: 'Kỹ năng', value: 'skill' }, { label: 'Cộng đồng', value: 'community' }]} />
//                   <Field label="Diễn giả / Khách mời" value={formData.speaker} onChange={e => setFormData({ ...formData, speaker: e.target.value })} />
//                 </div>
//                 <Field label="Mô tả sự kiện" type2="textarea" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
//               </div>
//             </div>

//             <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
//               <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
//                 Thời gian & Địa điểm
//               </h2>
//               <div className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <Field label="Ngày tổ chức" type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
//                   <Field label="Giờ bắt đầu" type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
//                   <Field label="Giờ kết thúc" type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Field label="Tòa nhà / Cơ sở" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Vd: Tòa A, ĐH CNTT" />
//                   <Field label="Phòng" required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="Vd: Hội trường Trần Chí Đáo" />
//                 </div>
//                 <div className="w-1/2">
//                   <Field label="Sức chứa (người)" type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} />
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24" style={{ borderColor: '#f1f5f9' }}>
//               <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
//                 Bản xem trước
//               </h2>
//               <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
//                 <div className="h-32 flex items-center justify-center text-3xl"
//                   style={{ background: 'linear-gradient(135deg, #4f46e588, #0891b288)' }}>
//                   🎓
//                 </div>
//                 <div className="p-4 bg-white">
//                   <div className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2"
//                     style={{ background: '#eef2ff', color: '#4f46e5' }}>Học thuật</div>
//                   <h3 className="font-bold text-sm mb-1 leading-snug line-clamp-2" style={{ color: '#1a1a2e' }}>
//                     {formData.title || 'Tên sự kiện của bạn'}
//                   </h3>
//                   <p className="text-xs mb-1" style={{ color: '#64748b' }}>
//                     📅 {formData.date ? new Date(formData.date).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'} · {formData.startTime || '--:--'}
//                   </p>
//                   <p className="text-xs truncate" style={{ color: '#64748b' }}>
//                     📍 {formData.room || 'Phòng'}, {formData.location || 'Địa điểm'}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }


import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchCategories, createEvent, updateEvent, apiFetch } from '../services/api';

function Field({ label, type = 'text', placeholder, value, onChange, required = false, type2 = 'input', options = [] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {type2 === 'textarea' ? (
        <textarea
          rows={4}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e2e8f0' }}
        />
      ) : type2 === 'select' ? (
        <select
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e2e8f0' }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e2e8f0' }}
        />
      )}
    </div>
  );
}

export default function EventFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Kiểm tra xem đang Tạo mới hay Sửa sự kiện
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    topicId: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    room: '',
    capacity: 100,
    speaker: '',
    description: '',
    bannerUrl: '',
  });

  // 1. Tải danh mục chuyên đề từ Backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories();
        if (res.success && res.data.length > 0) {
          setCategories(res.data);
          // Gán mặc định chuyên đề đầu tiên nếu đang tạo mới
          if (!isEditMode) {
            setFormData((prev) => ({ ...prev, topicId: res.data[0].ma_chuyen_de }));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải chuyên đề:', err);
      }
    };
    loadCategories();
  }, [isEditMode]);

  // 2. Nếu ở chế độ Edit, nạp dữ liệu cũ của sự kiện vào form
  useEffect(() => {
    if (!isEditMode) return;

    const loadEventDetail = async () => {
      try {
        setLoading(true);
        // Gọi API lấy chi tiết sự kiện
        const res = await apiFetch(`/api/events/${id}`);
        if (res.success && res.data) {
          const ev = res.data;
          setFormData({
            title: ev.ten_su_kien || '',
            topicId: ev.ma_chuyen_de || '',
            date: ev.ngay_dien_ra ? ev.ngay_dien_ra.split('T')[0] : '',
            startTime: ev.thoi_gian_bat_dau ? ev.thoi_gian_bat_dau.slice(0, 5) : '',
            endTime: ev.thoi_gian_ket_thuc ? ev.thoi_gian_ket_thuc.slice(0, 5) : '',
            location: ev.dia_diem || '',
            room: ev.phong || '',
            capacity: ev.so_luong_toi_da || 100,
            speaker: ev.dien_gia || '',
            description: ev.mo_ta || '',
            bannerUrl: ev.anh_bia || '',
          });
        }
      } catch (err) {
        setErrorMsg('Không thể nạp thông tin sự kiện cũ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [id, isEditMode]);

  // 3. Xử lý lưu sự kiện (Lưu nháp hoặc Xuất bản)
  const handleSubmit = async (status) => {
    setErrorMsg('');

    if (!formData.title || !formData.title.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện');
      return;
    }

    // Nếu xuất bản chính thức, kiểm tra nghiêm ngặt toàn bộ trường thông tin
    if (status === 'SapToChuc') {
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.location || !formData.room) {
        setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*) để xuất bản sự kiện');
        return;
      }

      if (formData.startTime >= formData.endTime) {
        setErrorMsg('Giờ bắt đầu phải diễn ra trước giờ kết thúc');
        return;
      }

      if (Number(formData.capacity) <= 0) {
        setErrorMsg('Sức chứa tối đa phải lớn hơn 0');
        return;
      }
    }

    // Đóng gói payload đúng theo schema Backend & Database
    const payload = {
      ten_su_kien: formData.title.trim(),
      ma_chuyen_de: formData.topicId ? Number(formData.topicId) : undefined,
      mo_ta: formData.description || undefined,
      dia_diem: formData.location || undefined,
      phong: formData.room || undefined,
      dien_gia: formData.speaker || undefined,
      anh_bia: formData.bannerUrl || undefined,
      ngay_dien_ra: formData.date || undefined,
      thoi_gian_bat_dau: formData.startTime || undefined,
      thoi_gian_ket_thuc: formData.endTime || undefined,
      so_luong_toi_da: formData.capacity ? Number(formData.capacity) : undefined,
      trang_thai_su_kien: status, // 'BanNhap' hoặc 'SapToChuc'
    };

    try {
      setSubmitting(true);
      let res;
      if (isEditMode) {
        res = await updateEvent(id, payload);
      } else {
        res = await createEvent(payload);
      }

      if (res.success) {
        alert(res.message || (status === 'BanNhap' ? 'Đã lưu nháp sự kiện!' : 'Đã xuất bản sự kiện!'));
        navigate('/dashboard/events');
      } else {
        setErrorMsg(res.message || 'Lỗi xử lý từ máy chủ');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find((c) => String(c.ma_chuyen_de) === String(formData.topicId))?.ten_chuyen_de || 'Chuyên đề';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-sm" style={{ color: '#64748b' }}>
          Đang nạp thông tin sự kiện...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        {/* Header & Nút thao tác */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/events')}
              className="p-2 rounded-xl border hover:bg-slate-50 transition-colors"
              style={{ borderColor: '#e2e8f0', color: '#475569' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                {isEditMode ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('BanNhap')}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              style={{ borderColor: '#e2e8f0', color: '#475569' }}
            >
              {submitting ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('SapToChuc')}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: '#4f46e5' }}
            >
              {submitting ? 'Đang gửi...' : 'Xuất bản sự kiện'}
            </button>
          </div>
        </div>

        {/* Thông báo lỗi */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin chung */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Thông tin chung
              </h2>
              <div className="space-y-4">
                <Field
                  label="Tên sự kiện"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Vd: Hội thảo AI 2026..."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Chủ đề / Chuyên đề"
                    required
                    type2="select"
                    value={formData.topicId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, topicId: e.target.value }))}
                    options={categories.map((c) => ({
                      label: c.ten_chuyen_de,
                      value: c.ma_chuyen_de,
                    }))}
                  />
                  <Field
                    label="Diễn giả / Khách mời"
                    value={formData.speaker}
                    onChange={(e) => setFormData((prev) => ({ ...prev, speaker: e.target.value }))}
                    placeholder="Vd: TS. Nguyễn Văn A"
                  />
                </div>
                <Field
                  label="Mô tả sự kiện"
                  type2="textarea"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Nội dung, mục đích và quyền lợi sinh viên tham gia..."
                />
              </div>
            </div>

            {/* Thời gian & Địa điểm */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Thời gian & Địa điểm
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field
                    label="Ngày tổ chức"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                  <Field
                    label="Giờ bắt đầu"
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  />
                  <Field
                    label="Giờ kết thúc"
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Tòa nhà / Cơ sở"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Vd: Tòa A, ĐH CNTT"
                  />
                  <Field
                    label="Phòng"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                    placeholder="Vd: Hội trường E"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <Field
                    label="Sức chứa (người)"
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bản xem trước */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Bản xem trước
              </h2>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
                <div
                  className="h-32 flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, #4f46e588, #0891b288)' }}
                >
                  🎓
                </div>
                <div className="p-4 bg-white">
                  <div
                    className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2"
                    style={{ background: '#eef2ff', color: '#4f46e5' }}
                  >
                    {selectedCategoryName}
                  </div>
                  <h3 className="font-bold text-sm mb-1 leading-snug line-clamp-2" style={{ color: '#1a1a2e' }}>
                    {formData.title || 'Tên sự kiện của bạn'}
                  </h3>
                  <p className="text-xs mb-1" style={{ color: '#64748b' }}>
                    📅 {formData.date ? new Date(formData.date).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'} · {formData.startTime || '--:--'}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#64748b' }}>
                    📍 {formData.room || 'Phòng'}, {formData.location || 'Địa điểm'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}