import { apiFetch, getAuthHeaders, API_URL } from './api.js';

/**
 * Lấy danh sách người tham gia của sự kiện (có filter, search, phân trang)
 * @param {number|string} eventId
 * @param {object} params - { status, search, page, limit }
 */
export async function fetchParticipants(eventId, { status, search, page = 1, limit = 20 } = {}) {
  const queryParams = new URLSearchParams();
  if (status && status !== 'all') queryParams.append('status', status);
  if (search && search.trim()) queryParams.append('search', search.trim());
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiFetch(`/api/organizer/events/${eventId}/participants${queryString}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Cập nhật trạng thái vé thủ công (BTC đổi sang DaCheckIn hoặc DaHuy)
 * @param {number|string} ticketId - ID vé (ma_dang_ky)
 * @param {string} newStatus - 'DaDangKy' | 'DaCheckIn' | 'DaHuy'
 */
export async function patchTicketStatus(ticketId, newStatus) {
  return apiFetch(`/api/organizer/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ trang_thai_ve: newStatus }),
  });
}

/**
 * Tải file xuất danh sách người tham gia (CSV có UTF-8 BOM hoặc Excel XLSX)
 * @param {number|string} eventId
 * @param {'csv'|'xlsx'} format
 */
export async function exportParticipants(eventId, format = 'csv') {
  const token = sessionStorage.getItem('token');
  const response = await fetch(
    `${API_URL}/api/organizer/events/${eventId}/export?format=${format}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Xuất dữ liệu thất bại');
  }

  // Lấy tên file từ header Content-Disposition nếu có
  const disposition = response.headers.get('Content-Disposition');
  let filename = `danh-sach-tham-gia-su-kien-${eventId}.${format}`;
  if (disposition && disposition.includes('filename=')) {
    const matches = disposition.match(/filename="?([^"]+)"?/);
    if (matches && matches[1]) {
      filename = matches[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);

  return { success: true, filename };
}
