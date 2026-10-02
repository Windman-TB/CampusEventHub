import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../services/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // step:
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

  // ==================================================
  // STEP 1
  // Request OTP
  // ==================================================

  async function handleRequestOtp(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiFetch(
        "/api/auth/forgot-password/request-otp",
        {
          method: "POST",

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      setSuccess(
        result?.message ||
          "Mã OTP đã được gửi đến email của bạn."
      );

      setStep(2);
    } catch (err) {
      setError(
        err?.message ||
          "Không thể gửi mã OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // STEP 2
  // Verify OTP
  // ==================================================

  async function handleVerifyOtp(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiFetch(
        "/api/auth/forgot-password/verify-otp",
        {
          method: "POST",

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );

      const token =
        result?.data?.resetToken;

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
      setError(
        err?.message ||
          "Mã OTP không hợp lệ."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // STEP 3
  // Reset password
  // ==================================================

  async function handleResetPassword(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!newPassword) {
      setError(
        "Vui lòng nhập mật khẩu mới."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Mật khẩu phải có ít nhất 8 ký tự."
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

      const result = await apiFetch(
        "/api/auth/forgot-password/reset",
        {
          method: "POST",

          body: JSON.stringify({
            resetToken,
            newPassword,
          }),
        }
      );

      setSuccess(
        result?.message ||
          "Đặt lại mật khẩu thành công."
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);
    } catch (err) {
      setError(
        err?.message ||
          "Không thể đặt lại mật khẩu."
      );
    } finally {
      setLoading(false);
    }
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
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
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
                <label className="block text-sm font-medium mb-1.5 text-slate-600">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={loading}
                  placeholder="mssv@gm.uit.edu.vn"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
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
                <label className="block text-sm font-medium mb-1.5 text-slate-600">
                  Mã OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  disabled={loading}
                  placeholder="123456"
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-center tracking-[0.5em] font-semibold outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading
                  ? "Đang xác thực..."
                  : "Xác nhận OTP"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setOtp("");
                  setError("");
                  setSuccess("");
                  setStep(1);
                }}
                className="w-full py-2.5 text-sm font-medium text-indigo-600"
              >
                Gửi lại OTP
              </button>
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
              Mật khẩu mới phải có ít nhất 8 ký tự.
            </p>

            <form
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-600">
                  Mật khẩu mới
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-600">
                  Xác nhận mật khẩu
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
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
          onClick={() =>
            navigate("/login")
          }
          className="w-full mt-6 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}