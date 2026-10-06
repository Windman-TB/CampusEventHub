import {
  apiFetch,
  getAuthHeaders,
  API_URL,
} from "./api.js";

import {
  clearAuthSession,
} from "../utils/authStorage.js";

const VALID_TICKET_STATUSES = new Set([
  "DaDangKy",
  "DaCheckIn",
  "DaHuy",
]);

const VALID_EXPORT_FORMATS = new Set([
  "csv",
  "xlsx",
]);

function normalizePositiveInteger(
  value,
  fallback
) {
  const parsed = Number.parseInt(
    value,
    10
  );

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function normalizeEventId(eventId) {
  const parsed = Number.parseInt(
    eventId,
    10
  );

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      "ID sự kiện không hợp lệ."
    );
  }

  return parsed;
}

function normalizeTicketId(ticketId) {
  const parsed = Number.parseInt(
    ticketId,
    10
  );

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      "ID vé không hợp lệ."
    );
  }

  return parsed;
}

function buildApiUrl(endpoint) {
  const baseUrl =
    API_URL.endsWith("/")
      ? API_URL.slice(0, -1)
      : API_URL;

  const normalizedEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  return `${baseUrl}${normalizedEndpoint}`;
}

async function createDownloadError(
  response
) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const error = new Error(
    data?.message ||
      `Xuất dữ liệu thất bại: ${response.status}`
  );

  error.status = response.status;

  error.code =
    data?.error?.code ||
    (typeof data?.error === "string"
      ? data.error
      : null);

  error.details =
    data?.details ||
    data?.errors ||
    data?.error?.details ||
    null;

  return error;
}

function getFilenameFromDisposition(
  disposition,
  fallbackFilename
) {
  if (!disposition) {
    return fallbackFilename;
  }

  // RFC 5987 / RFC 6266:
  // filename*=UTF-8''ten-file.csv
  const encodedMatch =
    disposition.match(
      /filename\*\s*=\s*UTF-8''([^;]+)/i
    );

  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(
        encodedMatch[1]
          .trim()
          .replace(/^"|"$/g, "")
      );
    } catch {
      // Nếu decode lỗi, tiếp tục thử filename thông thường.
    }
  }

  // filename="ten-file.csv"
  // hoặc filename=ten-file.csv
  const normalMatch =
    disposition.match(
      /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i
    );

  const filename =
    normalMatch?.[1] ||
    normalMatch?.[2];

  if (!filename) {
    return fallbackFilename;
  }

  return filename
    .trim()
    .replace(/^"|"$/g, "");
}

/**
 * Lấy danh sách người tham gia của một sự kiện.
 *
 * Backend:
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
  {
    status = "all",
    search = "",
    page = 1,
    limit = 20,
  } = {}
) {
  const normalizedEventId =
    normalizeEventId(eventId);

  const normalizedPage =
    normalizePositiveInteger(
      page,
      1
    );

  const normalizedLimit =
    Math.min(
      100,
      normalizePositiveInteger(
        limit,
        20
      )
    );

  const normalizedSearch =
    typeof search === "string"
      ? search.trim()
      : "";

  if (
    status !== "all" &&
    !VALID_TICKET_STATUSES.has(status)
  ) {
    throw new Error(
      "Trạng thái vé không hợp lệ."
    );
  }

  const queryParams =
    new URLSearchParams();

  if (status !== "all") {
    queryParams.set(
      "status",
      status
    );
  }

  if (normalizedSearch) {
    queryParams.set(
      "search",
      normalizedSearch
    );
  }

  queryParams.set(
    "page",
    String(normalizedPage)
  );

  queryParams.set(
    "limit",
    String(normalizedLimit)
  );

  return apiFetch(
    `/api/organizer/events/${normalizedEventId}/participants?${queryParams.toString()}`
  );
}

/**
 * Cập nhật trạng thái vé thủ công.
 *
 * Backend:
 * PATCH /api/organizer/tickets/:id/status
 *
 * @param {number|string} ticketId
 * @param {'DaDangKy'|'DaCheckIn'|'DaHuy'} newStatus
 * @returns {Promise<object>}
 */
export async function patchTicketStatus(
  ticketId,
  newStatus
) {
  const normalizedTicketId =
    normalizeTicketId(ticketId);

  if (
    !VALID_TICKET_STATUSES.has(
      newStatus
    )
  ) {
    throw new Error(
      "Trạng thái vé không hợp lệ."
    );
  }

  return apiFetch(
    `/api/organizer/tickets/${normalizedTicketId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        trang_thai_ve:
          newStatus,
      }),
    }
  );
}

/**
 * Xuất toàn bộ danh sách người tham gia ra CSV/XLSX.
 *
 * Backend:
 * GET /api/organizer/events/:id/export?format=csv|xlsx
 *
 * Không dùng apiFetch() vì response thành công là binary Blob,
 * không phải JSON.
 *
 * @param {number|string} eventId
 * @param {'csv'|'xlsx'} format
 * @returns {Promise<{success: boolean, filename: string}>}
 */
export async function exportParticipants(
  eventId,
  format = "csv"
) {
  const normalizedEventId =
    normalizeEventId(eventId);

  const normalizedFormat =
    String(format)
      .trim()
      .toLowerCase();

  if (
    !VALID_EXPORT_FORMATS.has(
      normalizedFormat
    )
  ) {
    throw new Error(
      'Định dạng xuất file chỉ hỗ trợ "csv" hoặc "xlsx".'
    );
  }

  const response = await fetch(
    buildApiUrl(
      `/api/organizer/events/${normalizedEventId}/export?format=${encodeURIComponent(
        normalizedFormat
      )}`
    ),
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    throw await createDownloadError(
      response
    );
  }

  const fallbackFilename =
    `participants-event-${normalizedEventId}.${normalizedFormat}`;

  const disposition =
    response.headers.get(
      "Content-Disposition"
    );

  const filename =
    getFilenameFromDisposition(
      disposition,
      fallbackFilename
    );

  const blob =
    await response.blob();

  const blobUrl =
    window.URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  try {
    link.href = blobUrl;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(
      link
    );

    link.click();
  } finally {
    link.remove();

    window.URL.revokeObjectURL(
      blobUrl
    );
  }

  return {
    success: true,
    filename,
  };
}