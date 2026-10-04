const supabasePkg = require('../config/supabase.js');
const supabase = supabasePkg.supabase || supabasePkg;

const getDashboardOverview = async (organizerId) => {
  // 1. Lấy toàn bộ sự kiện thuộc BTC hiện tại
  const { data: events, error: eventError } = await supabase
    .from('su_kien')
    .select(`
      ma_su_kien,
      ten_su_kien,
      ngay_dien_ra,
      trang_thai_su_kien,
      so_luong_toi_da
    `)
    .eq('ma_tai_khoan_to_chuc', organizerId)
    .eq('da_xoa', false);

  if (eventError) throw eventError;

  const eventList = events || [];
  const eventIds = eventList.map((event) => event.ma_su_kien);

  // BTC chưa có sự kiện nào
  if (eventIds.length === 0) {
    return {
      totalEvents: 0,
      ongoingEvents: 0,
      totalRegistrations: 0,
      totalCheckIns: 0,
      checkInRate: 0,
    };
  }

  // 2. Lấy toàn bộ lượt đăng ký thuộc các sự kiện của BTC
  const { data: registrations, error: registrationError } = await supabase
    .from('dang_ky')
    .select(`
      ma_dang_ky,
      ma_su_kien,
      trang_thai_ve,
      thoi_gian_tao,
      thoi_gian_check_in
    `)
    .in('ma_su_kien', eventIds)
    .eq('da_xoa', false);

  if (registrationError) throw registrationError;

  const registrationList = registrations || [];

  // Không tính vé đã hủy
  const validRegistrations = registrationList.filter(
    (item) => item.trang_thai_ve !== 'DaHuy'
  );

  const checkedIn = validRegistrations.filter(
    (item) => item.trang_thai_ve === 'DaCheckIn'
  );

  // YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  const ongoingEvents = eventList.filter(
    (event) =>
      event.ngay_dien_ra === today &&
      event.trang_thai_su_kien !== 'DaKetThuc'
  ).length;

  const checkInRate =
    validRegistrations.length === 0
      ? 0
      : Number(
          ((checkedIn.length / validRegistrations.length) * 100).toFixed(1)
        );

  return {
    totalEvents: eventList.length,
    ongoingEvents,
    totalRegistrations: validRegistrations.length,
    totalCheckIns: checkedIn.length,
    checkInRate,
  };
};

module.exports = {
  getDashboardOverview,
};