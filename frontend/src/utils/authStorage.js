const ACCESS_TOKEN_KEY = "accessToken";
const ROLE_KEY = "app_role";
const USER_KEY = "user";

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function setStoredRole(role) {
  localStorage.setItem(ROLE_KEY, role);
}

export function clearStoredRole() {
  localStorage.removeItem(ROLE_KEY);
}

export function clearAuthSession() {
  // Token hiện tại
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);

  // Thông tin user
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);

  // Role
  localStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(ROLE_KEY);

  // Dọn key cũ nếu trước đây project từng dùng "token"
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}