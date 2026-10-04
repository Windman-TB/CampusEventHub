const supabasePkg = require('../config/supabase.js');
const supabase = supabasePkg.supabase || supabasePkg;

/**
 * Tính toán trạng thái thực tế của sự kiện dựa vào thời gian hiện tại
 * Ép cứng múi giờ GMT+7 (Việt Nam) và giữ nguyên trạng thái BanNhap/DaKetThuc thủ công
 */
const computeEventStatus = (event) => {
  if (!event) return 'SapToChuc';

  // 1. Giữ nguyên nếu là Bản nháp hoặc đã được Ban tổ chức đánh dấu Đã kết thúc / Hủy thủ công
  if (event.trang_thai_su_kien === 'BanNhap' || event.trang_thai_su_kien === 'DaKetThuc') {
    return event.trang_thai_su_kien;
  }

  try {
    let dateStr = event.ngay_dien_ra;
    if (!dateStr) return event.trang_thai_su_kien || 'SapToChuc';

    // 2. Chuẩn hóa ngày về YYYY-MM-DD
    if (typeof dateStr === 'string') {
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      } else if (dateStr.includes('/')) {
        // Trường hợp ngày dạng DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3 && parts[0].length <= 2) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    // 3. Chuẩn hóa giờ về HH:mm:ss
    const normalizeTime = (t) => {
      if (!t) return '00:00:00';
      const parts = String(t).split(':');
      if (parts.length === 2) return `${t}:00`;
      return t;
    };

    const startTime = normalizeTime(event.thoi_gian_bat_dau);
    const endTime = normalizeTime(event.thoi_gian_ket_thuc);

    // 4. Ép cứng múi giờ GMT+7 (Việt Nam) để tránh lệch múi giờ hệ thống
    const start = new Date(`${dateStr}T${startTime}+07:00`).getTime();
    const end = new Date(`${dateStr}T${endTime}+07:00`).getTime();
    const now = Date.now();

    if (isNaN(start) || isNaN(end)) {
      return event.trang_thai_su_kien || 'SapToChuc';
    }

    // 5. So sánh khoảng thời gian
    if (now < start) {
      return 'SapToChuc';
    } else if (now >= start && now <= end) {
      return 'DangDienRa';
    } else {
      return 'DaKetThuc';
    }
  } catch (error) {
    console.error('Lỗi tính trạng thái:', error);
    return event.trang_thai_su_kien || 'SapToChuc';
  }
};

/**
 * Xử lý gán trang_thai_su_kien đã tính toán và sync ngầm vào DB nếu có sự thay đổi
 */
const processEventWithStatus = (event) => {
  if (!event) return event;

  const computedStatus = computeEventStatus(event);

  // Chỉ sync ngầm vào CSDL nếu trạng thái tính toán thay đổi VÀ trạng thái cũ không phải BanNhap/DaKetThuc
  if (
    computedStatus !== event.trang_thai_su_kien &&
    event.ma_su_kien &&
    event.trang_thai_su_kien !== 'BanNhap' &&
    event.trang_thai_su_kien !== 'DaKetThuc'
  ) {
    try {
      const updateRes = supabase
        .from('su_kien')
        .update({ trang_thai_su_kien: computedStatus })
        .eq('ma_su_kien', event.ma_su_kien);

      if (updateRes && typeof updateRes.catch === 'function') {
        updateRes.catch((err) =>
          console.warn(`[EventStatus] Lỗi sync trạng thái sự kiện #${event.ma_su_kien}:`, err?.message)
        );
      }
    } catch (err) {
      console.warn(`[EventStatus] Exception sync trạng thái sự kiện #${event.ma_su_kien}:`, err?.message);
    }
  }

  return {
    ...event,
    trang_thai_su_kien: computedStatus,
  };
};

module.exports = {
  computeEventStatus,
  processEventWithStatus,
};
