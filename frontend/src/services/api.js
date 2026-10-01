export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `Lỗi yêu cầu máy chủ: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = errorData.error;
    error.details = errorData.details;
    throw error;
  }

  return response.json();
}

// Hàm tiện ích lấy Authorization header theo quy chuẩn dự án
export const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 1. API lấy danh mục chuyên đề (GET /api/categories)
export async function fetchCategories() {
  return apiFetch("/api/categories");
}

// 2. API lấy danh sách sự kiện của Ban tổ chức (GET /api/organizer/events)
export async function fetchOrganizerEvents() {
  return apiFetch("/api/organizer/events", {
    headers: getAuthHeaders(),
  });
}

// 3. API tạo sự kiện mới (POST /api/events)
export async function createEvent(eventData) {
  return apiFetch("/api/events", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  });
}

// 4. API cập nhật sự kiện (PUT /api/events/:id)
export async function updateEvent(id, eventData) {
  return apiFetch(`/api/events/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  });
}

// 5. API xóa/hủy sự kiện (DELETE /api/events/:id)
export async function deleteEvent(id) {
  return apiFetch(`/api/events/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

export async function fetchEventById(id) {
  return apiFetch(`/api/events/${id}`);
}