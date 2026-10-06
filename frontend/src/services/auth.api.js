import { apiFetch } from "./api";

export function requestPasswordResetOtp(email) {
  return apiFetch(
    "/api/auth/forgot-password/request-otp",
    {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }
  );
}

export function verifyPasswordResetOtp(
  email,
  otp
) {
  return apiFetch(
    "/api/auth/forgot-password/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        otp,
      }),
    }
  );
}

export function resetPassword(
  resetToken,
  newPassword
) {
  return apiFetch(
    "/api/auth/forgot-password/reset",
    {
      method: "POST",
      body: JSON.stringify({
        resetToken,
        newPassword,
      }),
    }
  );
}