import { useState } from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  clearAuthSession,
} from "../utils/authStorage";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Tổng quan",
    path: "/dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
      />
    ),
  },
  {
    id: "events",
    label: "Sự kiện",
    path: "/dashboard/events",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
      />
    ),
  },
  {
    id: "participants",
    label: "Người tham gia",
    path: "/dashboard/participants",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    ),
  },
  {
    id: "staff",
    label: "Nhân viên",
    path: "/dashboard/staff",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    ),
  },
];

function getStoredUser() {
  const rawUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name || typeof name !== "string") {
    return "BT";
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "BT";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

function SidebarContent({
  onNavigate,
  onLogout,
  user,
}) {
  const displayName =
    user?.ho_ten || "Ban Tổ Chức";

  const displayEmail =
    user?.email || "btc@campus.edu.vn";

  const initials =
    getInitials(displayName);

  return (
    <>
      <div
        className="px-5 py-5 border-b"
        style={{
          borderColor: "#f1f5f9",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
            style={{
              background: "#4f46e5",
              fontFamily:
                "var(--font-display)",
            }}
          >
            CEH
          </div>

          <div>
            <div
              className="font-bold text-sm leading-tight"
              style={{
                fontFamily:
                  "var(--font-display)",
                color: "#1a1a2e",
              }}
            >
              Campus Event Hub
            </div>

            <div
              className="text-xs"
              style={{
                color: "#94a3b8",
              }}
            >
              Ban tổ chức
            </div>
          </div>
        </div>
      </div>

      <nav
        className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
        aria-label="Điều hướng Ban tổ chức"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={
              item.path ===
              "/dashboard"
            }
            onClick={() => {
              onNavigate?.();
            }}
            className={({
              isActive,
            }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? "bg-indigo-50"
                  : "hover:bg-slate-50"
              }`
            }
            style={({
              isActive,
            }) => ({
              color: isActive
                ? "#4f46e5"
                : "#64748b",
            })}
          >
            {({
              isActive,
            }) => (
              <>
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={
                    isActive
                      ? 2.5
                      : 1.5
                  }
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>

                <span className="truncate">
                  {item.label}
                </span>

                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        "#4f46e5",
                    }}
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className="px-3 py-4 border-t"
        style={{
          borderColor: "#f1f5f9",
        }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{
              background: "#0891b2",
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{
                color: "#1a1a2e",
              }}
              title={displayName}
            >
              {displayName}
            </div>

            <div
              className="text-xs truncate"
              style={{
                color: "#94a3b8",
              }}
              title={displayEmail}
            >
              {displayEmail}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-50 hover:text-red-600"
          style={{
            color: "#94a3b8",
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>

          Đăng xuất
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}) {
  const navigate =
    useNavigate();

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const user =
    getStoredUser();

  function handleLogout() {
    setDrawerOpen(false);

    clearAuthSession();

    navigate("/login", {
      replace: true,
    });
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "#f4f5f9",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col bg-white border-r sticky top-0 h-screen flex-shrink-0"
        style={{
          width: 248,
          borderColor: "#e2e8f0",
        }}
      >
        <SidebarContent
          onLogout={handleLogout}
          user={user}
        />
      </aside>

      {/* Mobile overlay */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 lg:hidden cursor-default"
          style={{
            background:
              "rgba(0,0,0,0.4)",
          }}
          onClick={
            handleCloseDrawer
          }
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden"
        style={{
          width: 260,
          transform:
            drawerOpen
              ? "translateX(0)"
              : "translateX(-100%)",
        }}
        aria-hidden={!drawerOpen}
      >
        <SidebarContent
          onNavigate={
            handleCloseDrawer
          }
          onLogout={handleLogout}
          user={user}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3"
          style={{
            borderColor: "#e2e8f0",
          }}
        >
          <button
            type="button"
            aria-label="Mở menu"
            aria-expanded={
              drawerOpen
            }
            onClick={() =>
              setDrawerOpen(true)
            }
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              style={{
                color: "#475569",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{
                background:
                  "#4f46e5",
              }}
            >
              CEH
            </div>

            <span
              className="font-semibold text-sm"
              style={{
                color: "#1a1a2e",
                fontFamily:
                  "var(--font-display)",
              }}
            >
              Campus Event Hub
            </span>
          </div>

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{
              background:
                "#0891b2",
            }}
            title={
              user?.ho_ten ||
              "Ban Tổ Chức"
            }
          >
            {getInitials(
              user?.ho_ten ||
                "Ban Tổ Chức"
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}