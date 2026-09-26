import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

function Field({ label, type = 'text', placeholder, value, onChange, required = false, type2 = 'input', options = [] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {type2 === 'textarea' ? (
        <textarea rows={4} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e2e8f0' }} />
      ) : type2 === 'select' ? (
        <select value={value} onChange={onChange}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e2e8f0' }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
          style={{ borderColor: '#e2e8f0' }} />
      )}
    </div>
  );
}

export default function EventFormPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', topic: 'academic', date: '', startTime: '', endTime: '', location: '', room: '', capacity: 100, speaker: '', description: ''
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard/events')}
              className="p-2 rounded-xl border hover:bg-slate-50 transition-colors"
              style={{ borderColor: '#e2e8f0', color: '#475569' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Tạo sự kiện mới
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-white"
              style={{ borderColor: '#e2e8f0', color: '#475569' }}>Lưu nháp</button>
            <button className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: '#4f46e5' }}>Xuất bản sự kiện</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Thông tin chung
              </h2>
              <div className="space-y-4">
                <Field label="Tên sự kiện" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Vd: Hội thảo AI 2026..." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Chủ đề" required type2="select" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    options={[{ label: 'Học thuật', value: 'academic' }, { label: 'Kỹ năng', value: 'skill' }, { label: 'Cộng đồng', value: 'community' }]} />
                  <Field label="Diễn giả / Khách mời" value={formData.speaker} onChange={e => setFormData({ ...formData, speaker: e.target.value })} />
                </div>
                <Field label="Mô tả sự kiện" type2="textarea" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Thời gian & Địa điểm
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Ngày tổ chức" type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  <Field label="Giờ bắt đầu" type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                  <Field label="Giờ kết thúc" type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tòa nhà / Cơ sở" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Vd: Tòa A, ĐH CNTT" />
                  <Field label="Phòng" required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="Vd: Hội trường Trần Chí Đáo" />
                </div>
                <div className="w-1/2">
                  <Field label="Sức chứa (người)" type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24" style={{ borderColor: '#f1f5f9' }}>
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
                Bản xem trước
              </h2>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
                <div className="h-32 flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, #4f46e588, #0891b288)' }}>
                  🎓
                </div>
                <div className="p-4 bg-white">
                  <div className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2"
                    style={{ background: '#eef2ff', color: '#4f46e5' }}>Học thuật</div>
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
