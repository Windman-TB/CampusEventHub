import {
  clearAuthSession,
} from "../utils/authStorage";

// ==========================================
// API CONFIG
// ==========================================

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// ==========================================
// TOKEN HELPERS
// ==========================================

export function getAccessToken() {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken")
  );
}

export function getAuthHeaders() {
  const token = getAccessToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

// ==========================================
// COMMON API FETCH
// ==========================================

export async function apiFetch(
  endpoint,
  options = {}
) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...options.headers,
  };

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Token hết hạn hoặc token không hợp lệ.
    if (response.status === 401) {
      clearAuthSession();
    }

    const error = new Error(
      data?.message ||
        `Lỗi yêu cầu máy chủ: ${response.status}`
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

    throw error;
  }

  return data;
}

// ==========================================
// CATEGORY APIs
// ==========================================

// GET /api/categories
export async function fetchCategories() {
  return apiFetch("/api/categories");
}

// ==========================================
// ORGANIZER EVENT APIs
// ==========================================

// GET /api/organizer/events
export async function fetchOrganizerEvents() {
  return apiFetch(
    "/api/organizer/events"
  );
}

// ==========================================
// EVENT APIs
// ==========================================

// GET /api/events/:id
export async function fetchEventById(id) {
  return apiFetch(
    `/api/events/${id}`
  );
}

// POST /api/events
export async function createEvent(
  eventData
) {
  return apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(eventData),
  });
}

// PUT /api/events/:id
export async function updateEvent(
  id,
  eventData
) {
  return apiFetch(
    `/api/events/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(eventData),
    }
  );
}

// DELETE /api/events/:id
export async function deleteEvent(id) {
  return apiFetch(
    `/api/events/${id}`,
    {
      method: "DELETE",
    }
  );
}
