const supabasePkg = require('../config/supabase.js');
const supabase = supabasePkg.supabase || supabasePkg;

// 1. Lấy danh mục chuyên đề
const getCategoriesService = async () => {
  const { data, error } = await supabase
    .from('chuyen_de')
    .select('*')
    .order('ten_chuyen_de', { ascending: true });

  if (error) throw error;
  return data;
};

// 2. Lấy danh sách sự kiện do Ban tổ chức sở hữu
const getOrganizerEventsService = async (maTaiKhoanToChuc) => {
  const { data, error } = await supabase
    .from('su_kien')
    .select(`
      *,
      chuyen_de (ma_chuyen_de, ten_chuyen_de),
      dang_ky (count)
    `)
    .eq('ma_tai_khoan_to_chuc', maTaiKhoanToChuc)
    .order('ma_su_kien', { ascending: false });

  if (error) throw error;

  return data.map((item) => ({
    ...item,
    so_ve_da_dat: item.dang_ky?.[0]?.count || 0,
  }));
};

// Lấy chi tiết 1 sự kiện theo ID
const getEventByIdService = async (id) => {
  const { data, error } = await supabase
    .from('su_kien')
    .select(`
      *,
      chuyen_de (ma_chuyen_de, ten_chuyen_de)
    `)
    .eq('ma_su_kien', id)
    .single();

  if (error) throw error;
  return data;
};

// 3. Tạo sự kiện mới
const createEventService = async (eventData, maTaiKhoanToChuc) => {
  const payload = {
    ...eventData,
    anh_bia: eventData.anh_bia || 'https://placehold.co/1200x630/png?text=Campus+Event',
    ma_tai_khoan_to_chuc: maTaiKhoanToChuc,
  };

  const { data, error } = await supabase
    .from('su_kien')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 4. Cập nhật sự kiện
const updateEventService = async (id, updateData, maTaiKhoanToChuc) => {
  const { count: registeredCount, error: countErr } = await supabase
    .from('dang_ky')
    .select('*', { count: 'exact', head: true })
    .eq('ma_su_kien', id)
    .neq('trang_thai_ve', 'DaHuy');

  if (countErr) throw countErr;

  if (updateData.so_luong_toi_da && updateData.so_luong_toi_da < (registeredCount || 0)) {
    throw new Error(`Không thể giảm sức chứa xuống dưới số vé đã đăng ký (${registeredCount} vé)`);
  }

  const { data, error } = await supabase
    .from('su_kien')
    .update(updateData)
    .eq('ma_su_kien', id)
    .eq('ma_tai_khoan_to_chuc', maTaiKhoanToChuc)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 5. Xóa mềm sự kiện
const deleteEventService = async (id, maTaiKhoanToChuc) => {
  const { data, error } = await supabase
    .from('su_kien')
    .update({ trang_thai_su_kien: 'DaKetThuc', da_xoa: true })
    .eq('ma_su_kien', id)
    .eq('ma_tai_khoan_to_chuc', maTaiKhoanToChuc)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  getCategoriesService,
  getOrganizerEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  deleteEventService,
};