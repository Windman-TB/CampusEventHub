import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} from "../services/auth.api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // 1 = nhập email
  // 2 = nhập OTP
  // 3 = đặt mật khẩu mới
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  // ==================================================
  // STEP 1 - REQUEST OTP
  // ==================================================
  async function handleRequestOtp(e) {
    e.preventDefault();
    clearMessages();

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestPasswordResetOtp(
        normalizedEmail
      );

      // Khi request OTP mới, mọi OTP/reset token cũ phía FE
      // không còn được tiếp tục sử dụng.
      setEmail(normalizedEmail);
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        result?.message ||
          "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi."
      );

      setStep(2);
    } catch (err) {
      setError(
        err?.message ||
          "Không thể gửi mã OTP. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // STEP 2 - VERIFY OTP
  // ==================================================
  async function handleVerifyOtp(e) {
    e.preventDefault();
    clearMessages();

    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError("OTP phải gồm đúng 6 chữ số.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyPasswordResetOtp(
        normalizeEmail(email),
        normalizedOtp
      );

      const token = result?.data?.resetToken;

      if (!token) {
        throw new Error(
          "Server không trả về resetToken."
        );
      }

      setResetToken(token);

      setSuccess(
        result?.message ||
          "Xác thực OTP thành công."
      );

      setStep(3);
    } catch (err) {
      setResetToken("");

      setError(
        err?.message ||
          "Mã OTP không hợp lệ hoặc đã hết hạn."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // RESEND OTP
  // ==================================================
  async function handleResendOtp() {
    clearMessages();

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError(
        "Không xác định được email. Vui lòng nhập lại email."
      );
      setStep(1);
      return;
    }

    try {
      setLoading(true);

      const result = await requestPasswordResetOtp(
        normalizedEmail
      );

      // OTP cũ và reset token cũ không còn được dùng.
      setOtp("");
      setResetToken("");

      setSuccess(
        result?.message ||
          "Mã OTP mới đã được gửi."
      );

      // Giữ người dùng ở màn hình nhập OTP.
      setStep(2);
    } catch (err) {
      setError(
        err?.message ||
          "Không thể gửi lại mã OTP. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // STEP 3 - RESET PASSWORD
  // ==================================================
  async function handleResetPassword(e) {
    e.preventDefault();
    clearMessages();

    if (!resetToken) {
      setError(
        "Phiên đặt lại mật khẩu không hợp lệ. Vui lòng xác thực OTP lại."
      );
      setStep(2);
      return;
    }

    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự."
      );
      return;
    }

    if (newPassword.length > 100) {
      setError(
        "Mật khẩu không được vượt quá 100 ký tự."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Mật khẩu xác nhận không khớp."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await resetPassword(
        resetToken,
        newPassword
      );

      setSuccess(
        result?.message ||
          "Đặt lại mật khẩu thành công."
      );

      // Không tái sử dụng reset token trên FE.
      setResetToken("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);
    } catch (err) {
      const code = err?.code;

      // Nếu token/OTP không còn hợp lệ thì đưa user về bước OTP.
      if (
        code === "RESET_TOKEN_EXPIRED" ||
        code === "INVALID_RESET_TOKEN" ||
        code === "OTP_ALREADY_USED" ||
        code === "OTP_EXPIRED" ||
        code === "INVALID_OTP"
      ) {
        setResetToken("");
        setOtp("");
        setStep(2);
      }

      setError(
        err?.message ||
          "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChangeEmail() {
    clearMessages();

    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");

    setStep(1);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "#f8fafc",
      }}
    >
      <div
        className="w-full bg-white rounded-2xl shadow-sm border p-8"
        style={{
          maxWidth: 440,
          borderColor: "#e2e8f0",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs"
            style={{
              background: "#4f46e5",
            }}
          >
            CEH
          </div>

          <div>
            <div className="font-bold text-slate-900">
              Campus Event Hub
            </div>

            <div className="text-xs text-slate-400">
              Khôi phục mật khẩu
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-7">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background:
                  item <= step
                    ? "#4f46e5"
                    : "#e2e8f0",
              }}
            />
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        {/* ==================================================
            STEP 1
        ================================================== */}
        {step === 1 && (
          <>
            <h1 className="font-bold text-xl text-slate-900 mb-2">
              Quên mật khẩu?
            </h1>

            <p className="text-sm text-slate-500 mb-6">
              Nhập email tài khoản. Hệ thống sẽ gửi mã OTP
              để xác minh danh tính.
            </p>

            <form
              onSubmit={handleRequestOtp}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium mb-1.5 text-slate-600"
                >
                  Email
                </label>

                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={loading}
                  required
                  placeholder="mssv@gm.uit.edu.vn"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Đang gửi..."
                  : "Gửi mã OTP"}
              </button>
            </form>
          </>
        )}

        {/* ==================================================
            STEP 2
        ================================================== */}
        {step === 2 && (
          <>
            <h1 className="font-bold text-xl text-slate-900 mb-2">
              Xác thực OTP
            </h1>

            <p className="text-sm text-slate-500 mb-6">
              Nhập mã OTP đã gửi đến{" "}
              <span className="font-medium text-slate-700">
                {email}
              </span>
              .
            </p>

            <form
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="forgot-otp"
                  className="block text-sm font-medium mb-1.5 text-slate-600"
                >
                  Mã OTP
                </label>

                <input
                  id="forgot-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  disabled={loading}
                  required
                  placeholder="123456"
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-center tracking-[0.5em] font-semibold outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 6
                }
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Đang xác thực..."
                  : "Xác nhận OTP"}
              </button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleChangeEmail}
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-60"
                >
                  Đổi email
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendOtp}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
                >
                  {loading
                    ? "Đang gửi..."
                    : "Gửi lại OTP"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ==================================================
            STEP 3
        ================================================== */}
        {step === 3 && (
          <>
            <h1 className="font-bold text-xl text-slate-900 mb-2">
              Đặt mật khẩu mới
            </h1>

            <p className="text-sm text-slate-500 mb-6">
              Mật khẩu mới phải có từ 8 đến 100 ký tự.
            </p>

            <form
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium mb-1.5 text-slate-600"
                >
                  Mật khẩu mới
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={100}
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium mb-1.5 text-slate-600"
                >
                  Xác nhận mật khẩu
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={100}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Đang cập nhật..."
                  : "Đặt lại mật khẩu"}
              </button>
            </form>
          </>
        )}

        {/* Back to login */}
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            navigate("/login")
          }
          className="w-full mt-6 text-sm font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-60"
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}
