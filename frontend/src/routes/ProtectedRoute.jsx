import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  getStoredRole,
} from "../utils/authStorage";

function getHomePathForRole(role) {
  switch (role) {
    case "ToChuc":
      return "/dashboard";

    case "NhanVienCheckIn":
      return "/check-in";

    case "SinhVien":
      return "/home";

    default:
      return "/login";
  }
}

export default function ProtectedRoute({
  children,
  allowedRoles = null,
}) {
  const location = useLocation();

  const token =
    localStorage.getItem(
      "accessToken"
    ) ||
    sessionStorage.getItem(
      "accessToken"
    );

  const role =
    getStoredRole();

  // Chưa đăng nhập
  if (!token) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // Có token nhưng không có role
  if (!role) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Route giới hạn role
  if (
    Array.isArray(
      allowedRoles
    ) &&
    !allowedRoles.includes(role)
  ) {
    return (
      <Navigate
        to={getHomePathForRole(role)}
        replace
      />
    );
  }

  return children;
}