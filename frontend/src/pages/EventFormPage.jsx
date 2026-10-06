import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchCategories, createEvent, updateEvent, uploadEventBanner, apiFetch } from '../services/api';

const DEFAULT_BANNER = 'https://placehold.co/1200x630/png?text=Campus+Event';

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
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

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
    quyen_loi: '',
    bannerUrl: '',
  });

  // 1. Tải danh mục chuyên đề từ Backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories();
        if (res.success && res.data.length > 0) {
          setCategories(res.data);
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
            quyen_loi: ev.quyen_loi || '',
            bannerUrl: ev.anh_bia || '',
          });
          setImageLoadError(false);
        }
      } catch (err) {
        setErrorMsg('Không thể nạp thông tin sự kiện cũ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [id, isEditMode]);

  // Handle file select (Instant Preview + Supabase Storage upload)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn định dạng tệp hình ảnh (PNG, JPG, WEBP,...)');
      return;
    }

    // 1. Instant Preview qua FileReader Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      if (base64Url) {
        setFormData((prev) => ({ ...prev, bannerUrl: base64Url }));
        setImageLoadError(false);
      }
    };
    reader.readAsDataURL(file);

    // 2. Thử upload tệp lên Supabase Storage qua Backend API
    const doUpload = async () => {
      try {
        setUploadingBanner(true);
        const base64String = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = (ev) => resolve(ev.target?.result);
          r.readAsDataURL(file);
        });

        const res = await uploadEventBanner({
          fileData: base64String,
          fileName: file.name,
          mimeType: file.type,
        });

        if (res.success && res.data?.url) {
          setFormData((prev) => ({ ...prev, bannerUrl: res.data.url }));
        }
      } catch (err) {
        console.warn('Upload lên Supabase Storage thất bại, tiếp tục dùng ảnh preview:', err.message);
      } finally {
        setUploadingBanner(false);
      }
    };

    doUpload();
  };

  // Reset về ảnh mặc định
  const handleResetBanner = () => {
    setFormData((prev) => ({ ...prev, bannerUrl: DEFAULT_BANNER }));
    setImageLoadError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Xử lý lưu sự kiện (Lưu nháp hoặc Xuất bản)
  const handleSubmit = async (status) => {
    setErrorMsg('');

    if (!formData.title || !formData.title.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện');
      return;
    }

    if (status === 'SapToChuc') {
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.location || !formData.room) {
        setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*) để xuất bản sự kiện');
        return;
      }

      if (formData.startTime >= formData.endTime) {
        setErrorMsg('Giờ bắt đầu phải diễn ra trước giờ kết thúc');
        return;
      }

      const startDateTime = new Date(`${formData.date}T${formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime}`);
      const now = new Date();
      if (startDateTime < now) {
        setErrorMsg('Thời gian bắt đầu sự kiện phải diễn ra trong tương lai');
        return;
      }

      if (Number(formData.capacity) <= 0) {
        setErrorMsg('Sức chứa tối đa phải lớn hơn 0');
        return;
      }
    }

    const finalBannerUrl = formData.bannerUrl && formData.bannerUrl.trim()
      ? formData.bannerUrl.trim()
      : DEFAULT_BANNER;

    const payload = {
      ten_su_kien: formData.title.trim(),
      ma_chuyen_de: formData.topicId ? Number(formData.topicId) : undefined,
      mo_ta: formData.description || undefined,
      dia_diem: formData.location || undefined,
      phong: formData.room || undefined,
      dien_gia: formData.speaker || undefined,
      quyen_loi: formData.quyen_loi || undefined,
      anh_bia: formData.bannerUrl || undefined,
      ngay_dien_ra: formData.date || undefined,
      thoi_gian_bat_dau: formData.startTime || undefined,
      thoi_gian_ket_thuc: formData.endTime || undefined,
      so_luong_toi_da: formData.capacity ? Number(formData.capacity) : undefined,
      trang_thai_su_kien: status,
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
  const displayBannerUrl = formData.bannerUrl || DEFAULT_BANNER;

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
                  placeholder="Nội dung, mục đích..."
                />
                <Field
                  label="Quyền lợi sinh viên"
                  type2="textarea"
                  value={formData.quyen_loi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quyen_loi: e.target.value }))}
                  placeholder="Các quyền lợi khi tham gia sự kiện (Cộng điểm rèn luyện, Giao lưu...)"
                />
              </div>
            </div>

            {/* Quản lý ảnh bìa sự kiện */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                    Ảnh bìa sự kiện
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tải file ảnh từ máy hoặc dán trực tiếp liên kết URL hình ảnh
                  </p>
                </div>
                {uploadingBanner && (
                  <span className="text-xs text-indigo-600 font-medium animate-pulse flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Đang lưu lên Supabase Storage...
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Nút bấm tải tệp từ máy */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Tải ảnh từ máy
                  </button>

                  <button
                    type="button"
                    onClick={handleResetBanner}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                  >
                    Mặc định
                  </button>
                </div>

                {/* Input nhập URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hoặc nhập đường dẫn URL ảnh:
                  </label>
                  <input
                    type="url"
                    value={formData.bannerUrl}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, bannerUrl: e.target.value }));
                      setImageLoadError(false);
                    }}
                    placeholder="https://example.com/hinh-anh-su-kien.jpg"
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
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

              <div className="rounded-xl overflow-hidden border bg-white" style={{ borderColor: '#e2e8f0' }}>
                {/* Banner Container với Hover Overlay Tải/Đổi ảnh */}
                <div
                  className="relative h-40 group cursor-pointer overflow-hidden bg-slate-100 flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!imageLoadError && displayBannerUrl ? (
                    <img
                      src={displayBannerUrl}
                      alt="Banner xem trước"
                      onError={() => setImageLoadError(true)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-3xl"
                      style={{ background: 'linear-gradient(135deg, #4f46e588, #0891b288)' }}
                    >
                      🎓
                    </div>
                  )}

                  {/* Overlay khi hover vào banner xem trước */}
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white gap-1 p-2 text-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0c-.693.047-1.332.435-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="text-xs font-semibold">Tải ảnh lên / Đổi ảnh bìa</span>
                  </div>
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

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                  Đổi ảnh bìa ở bản xem trước
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}