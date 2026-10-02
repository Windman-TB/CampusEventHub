import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import {
  clearAuthSession,
} from "../utils/authStorage";

import { apiFetch } from "../services/api";


// ==================================================
// Helpers
// ==================================================

function getRoleLabel(role) {
  switch (role) {
    case "SinhVien":
      return "Sinh viên";

    case "ToChuc":
      return "Ban tổ chức";

    case "NhanVienCheckIn":
      return "Nhân viên check-in";

    default:
      return role || "Chưa xác định";
  }
}


function getStatusLabel(status) {
  switch (status) {
    case "HoatDong":
      return "Tài khoản đang hoạt động";

    case "Khoa":
      return "Tài khoản đã bị khóa";

    default:
      return "Chưa xác định";
  }
}


function getInitials(name) {
  if (!name) {
    return "SV";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[parts.length - 2][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}


// ==================================================
// Profile Page
// ==================================================

export default function ProfilePage() {
  const navigate = useNavigate();

  // ==============================
  // Main state
  // ==============================
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editMode, setEditMode] = useState(false);

  // ==============================
  // Edit form
  // ==============================
  const [draft, setDraft] = useState({
    ho_ten: "",
    sdt: "",
    khoa: "",
  });

  // ==============================
  // Avatar modal
  // ==============================
  const [showAvatarModal, setShowAvatarModal] =
    useState(false);

  const [avatarDraft, setAvatarDraft] =
    useState("");


  // ==================================================
  // Load profile from Backend
  // GET /api/profile
  // ==================================================

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const result = await apiFetch(
        "/api/profile"
      );

      const profile = result?.data;

      if (!profile) {
        throw new Error(
          "Không nhận được dữ liệu hồ sơ từ máy chủ."
        );
      }

      setUser(profile);

      setDraft({
        ho_ten: profile.ho_ten || "",
        sdt: profile.sdt || "",
        khoa: profile.khoa || "",
      });

      setAvatarDraft(
        profile.avatar_url || ""
      );
    } catch (err) {
      setError(
        err?.message ||
          "Không thể tải hồ sơ cá nhân."
      );

      // Token lỗi / hết hạn
      if (err?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadProfile();
  }, []);


  // ==================================================
  // Start editing
  // ==================================================

  function handleStartEdit() {
    if (!user) {
      return;
    }

    setError("");
    setSuccess("");

    setDraft({
      ho_ten: user.ho_ten || "",
      sdt: user.sdt || "",
      khoa: user.khoa || "",
    });

    setEditMode(true);
  }


  // ==================================================
  // Cancel editing
  // ==================================================

  function handleCancel() {
    if (!user) {
      return;
    }

    setDraft({
      ho_ten: user.ho_ten || "",
      sdt: user.sdt || "",
      khoa: user.khoa || "",
    });

    setError("");
    setSuccess("");

    setEditMode(false);
  }


  // ==================================================
  // Save profile
  // PATCH /api/profile
  // ==================================================

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!draft.ho_ten.trim()) {
      setError(
        "Họ và tên không được để trống."
      );
      return;
    }

    if (draft.ho_ten.trim().length < 2) {
      setError(
        "Họ và tên phải có ít nhất 2 ký tự."
      );
      return;
    }

    try {
      setSaving(true);

      const result = await apiFetch(
        "/api/profile",
        {
          method: "PATCH",

          body: JSON.stringify({
            ho_ten:
              draft.ho_ten.trim(),

            sdt:
              draft.sdt.trim() || null,

            khoa:
              draft.khoa.trim() || null,
          }),
        }
      );

      const updatedProfile =
        result?.data;

      if (!updatedProfile) {
        throw new Error(
          "Không nhận được hồ sơ sau khi cập nhật."
        );
      }

      setUser(updatedProfile);

      setDraft({
        ho_ten:
          updatedProfile.ho_ten || "",

        sdt:
          updatedProfile.sdt || "",

        khoa:
          updatedProfile.khoa || "",
      });

      // Đồng bộ user đang lưu ở localStorage
      localStorage.setItem(
        "user",
        JSON.stringify(updatedProfile)
      );

      setEditMode(false);

      setSuccess(
        result?.message ||
          "Cập nhật hồ sơ thành công."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Không thể cập nhật hồ sơ."
      );
    } finally {
      setSaving(false);
    }
  }


  // ==================================================
  // Save avatar URL
  // PATCH /api/profile
  // ==================================================

  async function handleSaveAvatar() {
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const result = await apiFetch(
        "/api/profile",
        {
          method: "PATCH",

          body: JSON.stringify({
            avatar_url:
              avatarDraft.trim() ||
              null,
          }),
        }
      );

      const updatedProfile =
        result?.data;

      if (!updatedProfile) {
        throw new Error(
          "Không thể cập nhật ảnh đại diện."
        );
      }

      setUser(updatedProfile);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedProfile)
      );

      setShowAvatarModal(false);

      setSuccess(
        "Cập nhật ảnh đại diện thành công."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Không thể cập nhật ảnh đại diện."
      );
    } finally {
      setSaving(false);
    }
  }


  // ==================================================
  // Remove avatar
  // ==================================================

  async function handleRemoveAvatar() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await apiFetch(
        "/api/profile",
        {
          method: "PATCH",

          body: JSON.stringify({
            avatar_url: null,
          }),
        }
      );

      const updatedProfile =
        result?.data;

      setUser(updatedProfile);

      setAvatarDraft("");

      localStorage.setItem(
        "user",
        JSON.stringify(updatedProfile)
      );

      setShowAvatarModal(false);

      setSuccess(
        "Đã xóa ảnh đại diện."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Không thể xóa ảnh đại diện."
      );
    } finally {
      setSaving(false);
    }
  }


  // ==================================================
  // Logout
  // ==================================================

  function handleLogout() {
    clearAuthSession();

    navigate("/login", {
      replace: true,
    });
  }

  // ==================================================
  // Loading UI
  // ==================================================

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"
            />

            <p className="text-sm text-slate-500">
              Đang tải hồ sơ...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }


  // ==================================================
  // Fatal error
  // ==================================================

  if (!user) {
    return (
      <MainLayout>
        <div className="px-4 py-8">
          <div
            className="max-w-lg mx-auto p-5 rounded-2xl border border-red-200 bg-red-50"
          >
            <p className="text-sm text-red-700 mb-4">
              {error ||
                "Không thể tải hồ sơ cá nhân."}
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
            >
              Thử lại
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }


  const initials =
    getInitials(user.ho_ten);

  const roleLabel =
    getRoleLabel(
      user.loai_tai_khoan
    );

  const statusLabel =
    getStatusLabel(
      user.trang_thai_tai_khoan
    );

  const isActive =
    user.trang_thai_tai_khoan ===
    "HoatDong";


  return (
    <MainLayout>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="bg-white shadow-sm px-4 pb-6 pt-6">
        <h1 className="font-bold text-xl mb-5 text-slate-900">
          Hồ sơ cá nhân
        </h1>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl text-white"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5, #818cf8)",
              }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Ảnh đại diện"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                initials
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setAvatarDraft(
                  user.avatar_url || ""
                );

                setShowAvatarModal(
                  true
                );
              }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white bg-indigo-600"
              title="Thay đổi ảnh đại diện"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
              </svg>
            </button>
          </div>

          {/* User info */}
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-slate-900 truncate">
              {user.ho_ten}
            </h2>

            <p className="text-sm text-slate-500">
              {roleLabel}
              {user.khoa
                ? ` · ${user.khoa}`
                : ""}
            </p>

            <div className="flex items-center gap-1.5 mt-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? "bg-emerald-600"
                    : "bg-red-600"
                }`}
              />

              <span
                className={`text-xs font-medium ${
                  isActive
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* ==================================================
          REAL PROFILE SUMMARY
      ================================================== */}

      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <ProfileStat
          value={
            user.mssv || "—"
          }
          label="MSSV"
        />

        <ProfileStat
          value={roleLabel}
          label="Vai trò"
        />

        <ProfileStat
          value={
            isActive
              ? "Hoạt động"
              : "Đã khóa"
          }
          label="Trạng thái"
        />
      </div>


      {/* ==================================================
          MESSAGES
      ================================================== */}

      <div className="px-4">
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
      </div>


      {/* ==================================================
          PROFILE INFO
      ================================================== */}

      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="px-4 py-3.5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Thông tin tài khoản
            </h3>

            {!editMode && (
              <button
                type="button"
                onClick={
                  handleStartEdit
                }
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                  />
                </svg>

                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>


          {/* Họ tên */}
          <ProfileField
            label="Họ và tên"
            value={user.ho_ten}
            editable={editMode}
          >
            <input
              value={draft.ho_ten}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  ho_ten:
                    e.target.value,
                }))
              }
              className="w-full text-sm font-medium bg-transparent outline-none border-b border-indigo-600 pb-1 text-slate-900"
            />
          </ProfileField>


          {/* MSSV */}
          <ProfileField
            label="MSSV"
            value={user.mssv || "—"}
          />


          {/* Email */}
          <ProfileField
            label="Email"
            value={user.email || "—"}
          />


          {/* Khoa */}
          <ProfileField
            label="Khoa / Viện"
            value={user.khoa || "—"}
            editable={editMode}
          >
            <input
              value={draft.khoa}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  khoa:
                    e.target.value,
                }))
              }
              className="w-full text-sm font-medium bg-transparent outline-none border-b border-indigo-600 pb-1 text-slate-900"
            />
          </ProfileField>


          {/* Phone */}
          <ProfileField
            label="Số điện thoại"
            value={user.sdt || "—"}
            editable={editMode}
          >
            <input
              value={draft.sdt}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  sdt:
                    e.target.value,
                }))
              }
              className="w-full text-sm font-medium bg-transparent outline-none border-b border-indigo-600 pb-1 text-slate-900"
            />
          </ProfileField>


          {/* Role */}
          <ProfileField
            label="Vai trò"
            value={roleLabel}
          />


          {/* Account status */}
          <ProfileField
            label="Trạng thái tài khoản"
            value={statusLabel}
          />
        </div>
      </div>


      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="px-4 mt-4 space-y-3 mb-6">
        {editMode ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              Hủy
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-red-50 text-red-700 hover:bg-red-100"
          >
            Đăng xuất
          </button>
        )}
      </div>


      {/* ==================================================
          AVATAR MODAL
      ================================================== */}

      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Thay đổi ảnh đại diện
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowAvatarModal(
                    false
                  )
                }
              >
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>


            {/* Preview */}
            <div className="flex justify-center mb-5">
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-3xl text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5, #818cf8)",
                }}
              >
                {avatarDraft ? (
                  <img
                    src={avatarDraft}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>


            <label className="block text-sm font-medium mb-1.5 text-slate-600">
              URL ảnh đại diện
            </label>

            <input
              type="url"
              value={avatarDraft}
              onChange={(e) =>
                setAvatarDraft(
                  e.target.value
                )
              }
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
            />

            <p className="text-xs text-slate-400 mt-2">
              Hiện backend mới hỗ trợ
              lưu URL ảnh. Chưa có API
              upload file trực tiếp.
            </p>


            <div className="space-y-2 mt-5">
              {user.avatar_url && (
                <button
                  type="button"
                  onClick={
                    handleRemoveAvatar
                  }
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Xóa ảnh hiện tại
                </button>
              )}
            </div>


            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() =>
                  setShowAvatarModal(
                    false
                  )
                }
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={
                  handleSaveAvatar
                }
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving
                  ? "Đang lưu..."
                  : "Lưu ảnh"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}


// ==================================================
// Small reusable components
// ==================================================

function ProfileStat({
  value,
  label,
}) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
      <div className="font-bold text-sm sm:text-base text-indigo-600 truncate">
        {value}
      </div>

      <div className="text-xs mt-0.5 leading-tight text-slate-400">
        {label}
      </div>
    </div>
  );
}


function ProfileField({
  label,
  value,
  editable = false,
  children,
}) {
  return (
    <div className="px-4 py-3 border-b border-slate-50 last:border-0">
      <label className="block text-xs font-medium mb-1 text-slate-400">
        {label}
      </label>

      {editable && children ? (
        children
      ) : (
        <p className="text-sm font-medium text-slate-900 break-words">
          {value}
        </p>
      )}
    </div>
  );
}