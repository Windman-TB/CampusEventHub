const { z } = require('zod');

const todayDateString = () => new Date().toISOString().split('T')[0];

// 1. Schema thô cho bản nháp (BanNhap)
const draftEventObjectSchema = z.object({
  ten_su_kien: z
    .string({ message: 'Tên sự kiện không được để trống' })
    .min(1, 'Tên sự kiện không được để trống'),
  ma_chuyen_de: z.number().int().positive().default(1),
  mo_ta: z.string().optional().or(z.literal('')),
  dia_diem: z.string().optional().transform((v) => (v && String(v).trim() ? String(v).trim() : 'Chưa xác định')),
  phong: z.string().optional().transform((v) => (v && String(v).trim() ? String(v).trim() : 'Chưa xác định')),
  dien_gia: z.string().optional().or(z.literal('')),
  anh_bia: z.string().optional().or(z.literal('')),
  quyen_loi: z.string().optional().or(z.literal('')),
  ngay_dien_ra: z.string().optional().transform((v) => (v && String(v).trim() ? String(v).trim() : todayDateString())),
  thoi_gian_bat_dau: z.string().optional().transform((v) => (v && String(v).trim() ? String(v).trim() : '08:00')),
  thoi_gian_ket_thuc: z.string().optional().transform((v) => (v && String(v).trim() ? String(v).trim() : '09:00')),
  so_luong_toi_da: z.number().int().positive().default(100),
  trang_thai_su_kien: z.enum(['BanNhap', 'SapToChuc', 'DangDienRa', 'DaKetThuc']).default('BanNhap'),
});

// 2. Schema thô cho xuất bản sự kiện (SapToChuc)
const fullEventObjectSchema = z.object({
  ten_su_kien: z
    .string({ message: 'Tên sự kiện không được để trống' })
    .min(1, 'Tên sự kiện không được để trống'),
  ma_chuyen_de: z
    .number({ message: 'Vui lòng chọn chuyên đề' })
    .int('Chuyên đề không hợp lệ')
    .positive('Chuyên đề không hợp lệ'),
  mo_ta: z.string().optional().or(z.literal('')),
  dia_diem: z
    .string({ message: 'Địa điểm cơ sở không được để trống' })
    .min(1, 'Địa điểm cơ sở không được để trống'),
  phong: z
    .string({ message: 'Phòng tổ chức không được để trống' })
    .min(1, 'Phòng tổ chức không được để trống'),
  dien_gia: z.string().optional().or(z.literal('')),
  anh_bia: z.string().url('Đường dẫn ảnh bìa không hợp lệ').optional().or(z.literal('')),
  quyen_loi: z.string().optional().or(z.literal('')),
  ngay_dien_ra: z
    .string({ message: 'Ngày diễn ra không được để trống' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
  thoi_gian_bat_dau: z
    .string({ message: 'Thời gian bắt đầu không được để trống' })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Định dạng giờ bắt đầu: HH:mm'),
  thoi_gian_ket_thuc: z
    .string({ message: 'Thời gian kết thúc không được để trống' })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Định dạng giờ kết thúc: HH:mm'),
  so_luong_toi_da: z
    .number({ message: 'Sức chứa tối đa không được để trống' })
    .int('Sức chứa phải là số nguyên')
    .positive('Số lượng tối đa phải lớn hơn 0'),
  trang_thai_su_kien: z.enum(['BanNhap', 'SapToChuc', 'DangDienRa', 'DaKetThuc']).default('SapToChuc'),
});

// Hàm kiểm tra ràng buộc giờ bắt đầu < giờ kết thúc
const validateTimeOrder = (data) => {
  if (data.thoi_gian_bat_dau && data.thoi_gian_ket_thuc) {
    return data.thoi_gian_bat_dau < data.thoi_gian_ket_thuc;
  }
  return true;
};

const timeOrderRefinement = {
  message: 'Thời gian bắt đầu phải diễn ra trước thời gian kết thúc',
  path: ['thoi_gian_ket_thuc'],
};

// Schema đầy đủ có kiểm tra ràng buộc thời gian
const draftEventSchema = draftEventObjectSchema;
const fullEventSchema = fullEventObjectSchema.refine(validateTimeOrder, timeOrderRefinement);

// 3. Schema Tạo mới
const createEventSchema = {
  parse: (data) => {
    const raw = data || {};
    if (raw.trang_thai_su_kien === 'BanNhap') {
      return draftEventSchema.parse(raw);
    }
    return fullEventSchema.parse(raw);
  },
};

// 4. Schema Cập nhật: Dùng .partial() trên raw object schema trước, sau đó mới gắn .refine()
const updateEventSchema = {
  parse: (data) => {
    const raw = data || {};
    if (raw.trang_thai_su_kien === 'BanNhap') {
      return draftEventObjectSchema.partial().parse(raw);
    }
    return fullEventObjectSchema.partial().refine(validateTimeOrder, timeOrderRefinement).parse(raw);
  },
};

module.exports = {
  createEventSchema,
  updateEventSchema,
};