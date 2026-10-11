import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  fetchCategories,
  createEvent,
  updateEvent,
  uploadEventBanner,
  apiFetch,
} from '../services/api';

const DEFAULT_BANNER = 'https://placehold.co/1200x630/png?text=Campus+Event';
const MAX_BANNER_SIZE = 4 * 1024 * 1024; // Giới hạn để phù hợp JSON request 10 MB trên backend.
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function Field({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  type2 = 'input',
  options = [],
}) {
  const fieldId = useId();
  const className = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors';
  const style = { borderColor: '#e2e8f0' };

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {type2 === 'textarea' ? (
        <textarea
          id={fieldId}
          rows={4}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          aria-required={required}
          className={className}
          style={style}
        />
      ) : type2 === 'select' ? (
        <select
          id={fieldId}
          value={value ?? ''}
          onChange={onChange}
          aria-required={required}
          className={className}
          style={style}
        >
          <option value="" disabled>Chọn chuyên đề</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          aria-required={required}
          min={type === 'number' ? 1 : undefined}
          step={type === 'number' ? 1 : undefined}
          className={className}
          style={style}
        />
      )}
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.readAsDataURL(file);
  });
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatPreviewDate(value) {
  if (!value) return 'DD/MM/YYYY';
  const parts = String(value).slice(0, 10).split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function EventFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);
  const uploadRequestRef = useRef(0);
  const mountedRef = useRef(false);

  const [categories, setCategories] = useState([]);
  const [loadedEventId, setLoadedEventId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
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

  // Cleanup: không cập nhật form bằng kết quả upload sau khi rời trang.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      uploadRequestRef.current += 1;
    };
  }, []);

  // Tải danh mục, chỉ tự chọn chuyên đề mặc định khi TẠO sự kiện.
  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response?.data) ? response.data : [];
        setCategories(list);
        if (!isEditMode && list.length > 0) {
          setFormData((prev) => ({
            ...prev,
            topicId: prev.topicId || String(list[0].ma_chuyen_de),
          }));
        }
      })
      .catch((err) => {
        if (active) setErrorMsg(err.message || 'Không tải được danh mục chuyên đề.');
      });
    return () => { active = false; };
  }, [isEditMode]);

  // Tải dữ liệu khi sửa. Dùng promise callback để tránh setState đồng bộ trong effect.
  useEffect(() => {
    if (!isEditMode) return undefined;
    let active = true;

    apiFetch(`/api/events/${id}`)
      .then((response) => {
        if (!active) return;
        if (!response?.success || !response?.data) {
          throw new Error('Không tìm thấy thông tin sự kiện.');
        }
        const ev = response.data;
        setFormData({
          title: ev.ten_su_kien || '',
          topicId: String(ev.ma_chuyen_de || ''),
          date: ev.ngay_dien_ra ? String(ev.ngay_dien_ra).split('T')[0] : '',
          startTime: ev.thoi_gian_bat_dau ? String(ev.thoi_gian_bat_dau).slice(0, 5) : '',
          endTime: ev.thoi_gian_ket_thuc ? String(ev.thoi_gian_ket_thuc).slice(0, 5) : '',
          location: ev.dia_diem || '',
          room: ev.phong || '',
          capacity: ev.so_luong_toi_da ?? 100,
          speaker: ev.dien_gia || '',
          description: ev.mo_ta || '',
          quyen_loi: ev.quyen_loi || '',
          bannerUrl: ev.anh_bia || '',
        });
        setPreviewSrc('');
        setImageLoadError(false);
        setLoadError('');
      })
      .catch((err) => {
        if (active) setLoadError('Không thể nạp sự kiện: ' + (err.message || 'Lỗi không xác định'));
      })
      .finally(() => {
        if (active) setLoadedEventId(id);
      });

    return () => { active = false; };
  }, [id, isEditMode]);

  const loading = isEditMode && loadedEventId !== id;

  // Preview là dữ liệu tạm; chỉ lưu URL HTTP(S) đã upload thành công vào database.
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setErrorMsg('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_BANNER_SIZE) {
      setErrorMsg('Ảnh vượt quá 4 MB. Hãy chọn ảnh nhỏ hơn.');
      event.target.value = '';
      return;
    }

    const requestId = ++uploadRequestRef.current;
    setErrorMsg('');
    setBannerUploadError('');
    setUploadingBanner(true);
    setImageLoadError(false);
    setPreviewSrc('');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!mountedRef.current || requestId !== uploadRequestRef.current) return;
      if (typeof dataUrl !== 'string') throw new Error('File ảnh không hợp lệ.');

      setPreviewSrc(dataUrl);
      const response = await uploadEventBanner({
        fileData: dataUrl,
        fileName: file.name,
        mimeType: file.type,
      });

      if (!mountedRef.current || requestId !== uploadRequestRef.current) return;
      const uploadedUrl = response?.data?.url;
      if (!response?.success || typeof uploadedUrl !== 'string' || !isHttpUrl(uploadedUrl)) {
        throw new Error('Ảnh chưa được lưu thành URL công khai. Hãy kiểm tra bucket event-banners.');
      }

      setFormData((prev) => ({ ...prev, bannerUrl: uploadedUrl }));
      setPreviewSrc('');
      setBannerUploadError('');
    } catch (err) {
      if (mountedRef.current && requestId === uploadRequestRef.current) {
        setBannerUploadError(err.message || 'Không tải được ảnh.');
      }
    } finally {
      if (mountedRef.current && requestId === uploadRequestRef.current) {
        setUploadingBanner(false);
      }
    }
  };

  const handleResetBanner = () => {
    uploadRequestRef.current += 1;
    setFormData((prev) => ({ ...prev, bannerUrl: DEFAULT_BANNER }));
    setPreviewSrc('');
    setBannerUploadError('');
    setUploadingBanner(false);
    setImageLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBannerUrlChange = (event) => {
    uploadRequestRef.current += 1;
    setFormData((prev) => ({ ...prev, bannerUrl: event.target.value }));
    setPreviewSrc('');
    setBannerUploadError('');
    setUploadingBanner(false);
    setImageLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (status) => {
    if (submitting) return;
    setErrorMsg('');

    if (uploadingBanner) {
      setErrorMsg('Vui lòng đợi ảnh bìa tải xong rồi lưu sự kiện.');
      return;
    }
    if (bannerUploadError) {
      setErrorMsg('Ảnh tải lên chưa thành công. Vui lòng tải lại, nhập URL hoặc chọn ảnh mặc định.');
      return;
    }
    if (!formData.title.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện.');
      return;
    }

    const capacity = Number(formData.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      setErrorMsg('Sức chứa phải là số nguyên dương.');
      return;
    }

    const topicId = Number(formData.topicId);
    if (status === 'SapToChuc') {
      if (!Number.isInteger(topicId) || topicId <= 0) {
        setErrorMsg('Vui lòng chọn chuyên đề.');
        return;
      }
      if (!formData.date || !formData.startTime || !formData.endTime ||
          !formData.location.trim() || !formData.room.trim()) {
        setErrorMsg('Vui lòng điền đầy đủ ngày, giờ, địa điểm và phòng để xuất bản sự kiện.');
        return;
      }
      if (formData.startTime >= formData.endTime) {
        setErrorMsg('Giờ bắt đầu phải sớm hơn giờ kết thúc.');
        return;
      }
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      if (Number.isNaN(startDateTime.getTime()) || startDateTime <= new Date()) {
        setErrorMsg('Thời gian bắt đầu sự kiện phải ở trong tương lai.');
        return;
      }
    }

    const finalBannerUrl = formData.bannerUrl.trim() || DEFAULT_BANNER;
    if (!isHttpUrl(finalBannerUrl)) {
      setErrorMsg('Ảnh bìa phải là URL HTTP(S) hợp lệ; không thể lưu ảnh Base64 trực tiếp.');
      return;
    }

    const payload = {
      ten_su_kien: formData.title.trim(),
      ma_chuyen_de: Number.isInteger(topicId) && topicId > 0 ? topicId : undefined,
      mo_ta: formData.description || undefined,
      dia_diem: formData.location.trim() || undefined,
      phong: formData.room.trim() || undefined,
      dien_gia: formData.speaker || undefined,
      quyen_loi: formData.quyen_loi || undefined,
      anh_bia: finalBannerUrl,
      ngay_dien_ra: formData.date || undefined,
      thoi_gian_bat_dau: formData.startTime || undefined,
      thoi_gian_ket_thuc: formData.endTime || undefined,
      so_luong_toi_da: capacity,
      trang_thai_su_kien: status,
    };

    setSubmitting(true);
    try {
      const response = isEditMode
        ? await updateEvent(id, payload)
        : await createEvent(payload);

      if (!response?.success) {
        throw new Error(response?.message || 'Máy chủ không thể lưu sự kiện.');
      }

      window.alert(response.message || (status === 'BanNhap' ? 'Đã lưu nháp!' : 'Đã xuất bản!'));
      navigate('/dashboard/events');
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find(
    (category) => String(category.ma_chuyen_de) === String(formData.topicId)
  )?.ten_chuyen_de || 'Chuyên đề';
  const displayBannerUrl = previewSrc || formData.bannerUrl || DEFAULT_BANNER;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-sm text-slate-500">
          Đang nạp thông tin sự kiện...
        </div>
      </DashboardLayout>
    );
  }

  if (isEditMode && loadError) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-700">{loadError}</p>
          <button type="button" onClick={() => navigate('/dashboard/events')}
            className="mt-4 px-4 py-2 rounded-xl border border-slate-200 text-slate-700">
            Quay lại danh sách sự kiện
          </button>
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

              disabled={submitting || uploadingBanner}

              onClick={() => handleSubmit('BanNhap')}

              className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"

              style={{ borderColor: '#e2e8f0', color: '#475569' }}

            >

              {submitting ? 'Đang lưu...' : 'Lưu nháp'}

            </button>

            <button

              type="button"

              disabled={submitting || uploadingBanner}

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

                    Đang tải ảnh bìa...

                  </span>

                )}

              </div>

              <div className="space-y-4">

                {/* Nút bấm tải tệp từ máy */}

                <div className="flex flex-wrap items-center gap-3">

                  <input

                    type="file"

                    ref={fileInputRef}

                    accept="image/jpeg,image/png,image/webp"

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

                  <label htmlFor="banner-url-input" className="block text-xs font-medium text-slate-600 mb-1">

                    Hoặc nhập đường dẫn URL ảnh:

                  </label>

                  <input

                    id="banner-url-input"

                    type="url"

                    value={formData.bannerUrl}

                    onChange={handleBannerUrlChange}

                    placeholder="https://example.com/hinh-anh-su-kien.jpg"

                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"

                    style={{ borderColor: '#e2e8f0' }}

                  />

                </div>
                {bannerUploadError && (
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {bannerUploadError} Hãy thử ảnh khác, nhập URL hoặc chọn Mặc định.
                  </p>
                )}
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
                  role="button"
                  tabIndex={0}
                  aria-label="Tải ảnh hoặc đổi ảnh bìa sự kiện"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}

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

                    📅 {formData.date ? formatPreviewDate(formData.date) : 'DD/MM/YYYY'} · {formData.startTime || '--:--'}

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
