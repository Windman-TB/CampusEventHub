import { apiFetch, getAuthHeaders } from './api.js';

/**
 * Tìm kiếm sinh viên theo MSSV hoặc họ tên (gợi ý trong Modal cấp quyền)
 * @param {string} query - MSSV hoặc tên (cần tối thiểu 2 ký tự)
 */
export async function searchStudents(query) {
  if (!query || query.trim().length < 2) {
    return { success: true, data: [] };
  }
  return apiFetch(
    `/api/organizer/students/search?query=${encodeURIComponent(query.trim())}`,
    {
      headers: getAuthHeaders(),
    }
  );
}

/**
 * Lấy danh sách nhân viên soát vé được phân công của một sự kiện
 * @param {number|string} eventId
 */
export async function fetchStaff(eventId) {
  return apiFetch(`/api/organizer/events/${eventId}/staff`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Phân công quyền nhân viên soát vé cho một sinh viên
 * @param {number|string} eventId
 * @param {number} maTaiKhoan - ID tài khoản sinh viên (ma_tai_khoan)
 */
export async function addStaff(eventId, maTaiKhoan) {
  return apiFetch(`/api/organizer/events/${eventId}/staff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ma_tai_khoan: maTaiKhoan }),
  });
}

/**
 * Thu hồi quyền soát vé của nhân viên
 * @param {number|string} eventId
 * @param {number|string} staffId - ma_nhan_vien
 */
export async function revokeStaff(eventId, staffId) {
  return apiFetch(`/api/organizer/events/${eventId}/staff/${staffId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}
