import { apiFetch, getAuthHeaders, API_URL } from "./api.js";
import { clearAuthSession } from "../utils/authStorage.js";

const VALID_TICKET_STATUSES = new Set(["DaDangKy", "DaCheckIn", "DaHuy"]);
const VALID_EXPORT_FORMATS = new Set(["csv", "xlsx"]);

/**
 * Chuẩn hóa các giá trị nguyên dương dùng cho phân trang.
 * Không chấp nhận chuỗi như "12abc", số âm hoặc số thập phân.
 */
function normalizePositiveInteger(value, fallback) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeEventId(eventId) {
  const id = normalizePositiveInteger(eventId, null);
  if (id === null) {
    throw new Error("ID sự kiện không hợp lệ.");
  }
  return id;
}

function normalizeTicketId(ticketId) {
  const id = normalizePositiveInteger(ticketId, null);
  if (id === null) {
    throw new Error("ID vé không hợp lệ.");
  }
  return id;
}

function buildApiUrl(endpoint) {
  const baseUrl = API_URL.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Khi xuất CSV/XLSX thất bại, backend trả JSON thay vì Blob.
 * .catch() loại bỏ lỗi ESLint no-useless-assignment từ khối try/catch cũ.
 */
async function createDownloadError(response) {
  const data = await response.json().catch(() => null);

  const error = new Error(
    data?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      `Xuất dữ liệu thất bại: ${response.status}`
  );

  error.status = response.status;
  error.code =
    data?.error?.code ||
    (typeof data?.error === "string" ? data.error : null);
  error.details =
    data?.details || data?.errors || data?.error?.details || null;

  return error;
}

/**
 * Lấy tên tệp từ Content-Disposition theo RFC 6266 / RFC 5987.
 * Ưu tiên filename*=UTF-8''...; fallback sang filename="...".
 * Loại bỏ dấu phân cách đường dẫn và ký tự không hợp lệ cho tên file.
 */
function getFilenameFromDisposition(disposition, fallbackFilename) {
  if (!disposition) {
    return fallbackFilename;
  }

  let filename = "";

  const encodedMatch = disposition.match(
    /filename\*\s*=\s*(?:"?UTF-8'[^']*')([^;"\s]+)/i
  );

  if (encodedMatch?.[1]) {
    try {
      filename = decodeURIComponent(encodedMatch[1]);
    } catch {
      // Header không hợp lệ: thử filename thông thường.
    }
  }

  if (!filename) {
    const normalMatch = disposition.match(
      /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i
    );
    filename = normalMatch?.[1] || normalMatch?.[2] || "";
  }

  const safeFilename = Array.from(
    filename.trim().replace(/^"|"$/g, "")
  )
    .map((character) => {
      const charCode = character.charCodeAt(0);
      return /[\\/:*?"<>|]/.test(character) || charCode < 32 || charCode === 127
        ? "_"
        : character;
    })
    .join("")
    .replace(/^\.+$/, "");

  return safeFilename || fallbackFilename;
}

/**
 * Lấy danh sách người tham gia của một sự kiện.
 * GET /api/organizer/events/:id/participants
 *
 * @param {number|string} eventId
 * @param {object} params
 * @param {'all'|'DaDangKy'|'DaCheckIn'|'DaHuy'} [params.status='all']
 * @param {string} [params.search='']
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>}
 */
export async function fetchParticipants(
  eventId,
  { status = "all", search = "", page = 1, limit = 20 } = {}
) {
  const normalizedEventId = normalizeEventId(eventId);
  const normalizedPage = normalizePositiveInteger(page, 1);
  const normalizedLimit = Math.min(100, normalizePositiveInteger(limit, 20));
  const normalizedSearch = typeof search === "string" ? search.trim() : "";

  if (status !== "all" && !VALID_TICKET_STATUSES.has(status)) {
    throw new Error("Trạng thái vé không hợp lệ.");
  }

  const queryParams = new URLSearchParams();

  if (status !== "all") {
    queryParams.set("status", status);
  }
  if (normalizedSearch) {
    queryParams.set("search", normalizedSearch);
  }

  queryParams.set("page", String(normalizedPage));
  queryParams.set("limit", String(normalizedLimit));

  return apiFetch(
    `/api/organizer/events/${normalizedEventId}/participants?${queryParams.toString()}`
  );
}

/**
 * Cập nhật trạng thái vé thủ công.
 * PATCH /api/organizer/tickets/:id/status
 *
 * @param {number|string} ticketId
 * @param {'DaDangKy'|'DaCheckIn'|'DaHuy'} newStatus
 * @returns {Promise<object>}
 */
export async function patchTicketStatus(ticketId, newStatus) {
  const normalizedTicketId = normalizeTicketId(ticketId);

  if (!VALID_TICKET_STATUSES.has(newStatus)) {
    throw new Error("Trạng thái vé không hợp lệ.");
  }

  return apiFetch(`/api/organizer/tickets/${normalizedTicketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ trang_thai_ve: newStatus }),
  });
}

/**
 * Xuất danh sách người tham gia ra CSV hoặc XLSX.
 * GET /api/organizer/events/:id/export?format=csv|xlsx
 *
 * Không dùng apiFetch() vì response thành công là binary Blob.
 * @param {number|string} eventId
 * @param {'csv'|'xlsx'} format
 * @returns {Promise<{success: boolean, filename: string}>}
 */
export async function exportParticipants(eventId, format = "csv") {
  const normalizedEventId = normalizeEventId(eventId);
  const normalizedFormat = String(format).trim().toLowerCase();

  if (!VALID_EXPORT_FORMATS.has(normalizedFormat)) {
    throw new Error('Định dạng xuất file chỉ hỗ trợ "csv" hoặc "xlsx".');
  }

  const endpoint =
    `/api/organizer/events/${normalizedEventId}/export` +
    `?format=${encodeURIComponent(normalizedFormat)}`;

  const response = await fetch(buildApiUrl(endpoint), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }
    throw await createDownloadError(response);
  }

  const fallbackFilename =
    `participants-event-${normalizedEventId}.${normalizedFormat}`;
  const filename = getFilenameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFilename
  );

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = blobUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Chờ trình duyệt bắt đầu tải trước khi thu hồi object URL.
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  }

  return { success: true, filename };
}
