import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MOCK_EVENTS } from "../mocks/mockData";
import { BottomNav } from "../layouts/MainLayout";
import { clearAuthSession } from "../utils/authStorage";

export default function CheckInPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("scan");
  const [manualCode, setManualCode] = useState("");
  const [flashOn, setFlashOn] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState(
    MOCK_EVENTS[0]?.id || ""
  );

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanLine, setScanLine] = useState(0);

  // ==============================
  // LOGOUT
  // ==============================
  function handleLogout() {
    clearAuthSession();

    navigate("/login", {
      replace: true,
    });
  }

  // ==============================
  // SCAN LINE ANIMATION
  // ==============================
  useEffect(() => {
    const id = setInterval(() => {
      setScanLine((value) => (value + 1.5) % 100);
    }, 16);

    return () => {
      clearInterval(id);
    };
  }, []);

  // ==============================
  // EVENT INFORMATION
  // ==============================
  const selectedEvent = MOCK_EVENTS.find(
    (event) => event.id === selectedEventId
  );

  const checkedInCount = selectedEvent
    ? Math.floor(selectedEvent.registered * 0.7)
    : 0;

  const totalActive = selectedEvent
    ? selectedEvent.registered
    : 0;

  // ==============================
  // HANDLE CHECK-IN
  // ==============================
  function handleScan(code) {
    const input = (code || manualCode).trim();

    if (!input) {
      return;
    }

    // TODO:
    // Hiện tại vẫn là mock check-in.
    // Sau này thay bằng API backend thực tế.
    const isSuccess = !input.includes("fail");

    const scanResult = {
      success: isSuccess,

      studentName: isSuccess
        ? "Nguyễn Văn A"
        : null,

      studentId: input,

      time: new Date().toLocaleTimeString(
        "vi-VN",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      ),

      message: isSuccess
        ? "Thành công"
        : "Vé không hợp lệ hoặc đã sử dụng",

      faculty: isSuccess
        ? "Công nghệ Thông tin"
        : null,
    };

    setResult(scanResult);

    const historyEntry = {
      name:
        scanResult.studentName ??
        "—",

      studentId:
        scanResult.studentId,

      time:
        scanResult.time,

      status:
        scanResult.success
          ? "success"
          : "failed",

      message:
        scanResult.success
          ? undefined
          : scanResult.message,
    };

    setHistory((previousHistory) => [
      historyEntry,
      ...previousHistory,
    ]);

    if (scanResult.success) {
      setTimeout(() => {
        setResult(null);
      }, 2000);
    }

    setManualCode("");
  }

  // ==============================
  // DEMO SCAN
  // ==============================
  function handleDemoScan() {
    handleScan(
      `TKT-2026-003412|${selectedEventId}|22521001`
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen pb-20"
      style={{
        background: "#0f0f1a",
      }}
    >
      {/* ==============================
          HEADER
      ============================== */}
      <div
        className="px-4 pb-3"
        style={{
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-white">
              Điểm danh
            </h1>

            <p
              className="text-xs"
              style={{
                color: "#475569",
              }}
            >
              Campus Event Hub
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-white/10"
            style={{
              background:
                "rgba(255,255,255,0.08)",
              color: "#64748b",
              border:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Thoát
          </button>
        </div>
      </div>

      {/* ==============================
          TAB BAR
      ============================== */}
      <div
        className="flex mx-4 mb-3 p-1 rounded-xl"
        style={{
          background:
            "rgba(255,255,255,0.06)",
        }}
      >
        {["scan", "history"].map(
          (currentTab) => (
            <button
              key={currentTab}
              type="button"
              onClick={() =>
                setTab(currentTab)
              }
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background:
                  tab === currentTab
                    ? "#4f46e5"
                    : "transparent",

                color:
                  tab === currentTab
                    ? "white"
                    : "#475569",
              }}
            >
              {currentTab === "scan"
                ? "Quét mã QR"
                : `Lịch sử (${history.length})`}
            </button>
          )
        )}
      </div>

      {tab === "scan" ? (
        <>
          {/* ==============================
              EVENT SELECTOR
          ============================== */}
          <div className="px-4 mb-3">
            <p
              className="text-xs font-medium mb-1.5"
              style={{
                color: "#475569",
              }}
            >
              Sự kiện hiện tại
            </p>

            <select
              value={selectedEventId}
              onChange={(event) =>
                setSelectedEventId(
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none appearance-none"
              style={{
                background:
                  "rgba(255,255,255,0.08)",
                color: "white",
                border:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {MOCK_EVENTS.map(
                (event) => (
                  <option
                    key={event.id}
                    value={event.id}
                    style={{
                      background:
                        "#1a1a2e",
                      color: "white",
                    }}
                  >
                    {event.title}
                  </option>
                )
              )}
            </select>

            {selectedEvent && (
              <div className="flex gap-4 mt-2">
                <p
                  className="text-xs"
                  style={{
                    color: "#334155",
                  }}
                >
                  Đã điểm danh:{" "}
                  <span
                    style={{
                      color: "#4f46e5",
                      fontFamily:
                        "monospace",
                    }}
                  >
                    {checkedInCount}
                  </span>

                  {" / "}

                  <span
                    style={{
                      fontFamily:
                        "monospace",
                    }}
                  >
                    {totalActive}
                  </span>{" "}
                  đăng ký
                </p>
              </div>
            )}
          </div>

          {/* ==============================
              CAMERA VIEWPORT
          ============================== */}
          <div
            className="mx-4 rounded-3xl overflow-hidden relative flex-shrink-0"
            style={{
              height: "55vw",
              maxHeight: 300,
              background:
                "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg
                className="w-20 h-20"
                style={{
                  color: "#4f46e5",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
              </svg>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-40 h-40">
                {[
                  ["top", "left"],
                  ["top", "right"],
                  ["bottom", "left"],
                  ["bottom", "right"],
                ].map(
                  (
                    [
                      vertical,
                      horizontal,
                    ],
                    index
                  ) => (
                    <div
                      key={index}
                      className="absolute"
                      style={{
                        [vertical]: 0,
                        [horizontal]: 0,
                        width: 28,
                        height: 28,
                      }}
                    >
                      <div
                        style={{
                          position:
                            "absolute",
                          [vertical]: 0,
                          [horizontal]: 0,
                          width: 2,
                          height: 24,
                          background:
                            "#818cf8",
                          borderRadius: 1,
                        }}
                      />

                      <div
                        style={{
                          position:
                            "absolute",
                          [vertical]: 0,
                          [horizontal]: 0,
                          width: 24,
                          height: 2,
                          background:
                            "#818cf8",
                          borderRadius: 1,
                        }}
                      />
                    </div>
                  )
                )}

                <div
                  className="absolute left-0 right-0"
                  style={{
                    height: 2,
                    top: `${scanLine}%`,
                    background:
                      "linear-gradient(to right, transparent, #4f46e5, transparent)",
                    boxShadow:
                      "0 0 12px #4f46e5",
                  }}
                />

                <p
                  className="absolute text-xs font-medium text-center w-full whitespace-nowrap"
                  style={{
                    bottom: -28,
                    color: "#475569",
                  }}
                >
                  Đưa mã QR vào khung
                </p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFlashOn(
                    (value) => !value
                  )
                }
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background:
                    flashOn
                      ? "#f59e0b"
                      : "rgba(255,255,255,0.12)",
                }}
              >
                <svg
                  className="w-5 h-5"
                  style={{
                    color: flashOn
                      ? "white"
                      : "#64748b",
                  }}
                  fill={
                    flashOn
                      ? "currentColor"
                      : "none"
                  }
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ==============================
              MANUAL INPUT
          ============================== */}
          <div className="mx-4 mt-4">
            <p
              className="text-xs mb-2"
              style={{
                color: "#475569",
              }}
            >
              Nhập mã vé thủ công
            </p>

            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(event) =>
                  setManualCode(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    handleScan();
                  }
                }}
                placeholder="VD: TKT-2026-003412"
                className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                style={{
                  background:
                    "rgba(255,255,255,0.07)",
                  color: "white",
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  fontFamily:
                    "monospace",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  handleScan()
                }
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-white flex-shrink-0"
                style={{
                  background:
                    "#4f46e5",
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>

          {/* ==============================
              DEMO SCAN
          ============================== */}
          <div className="px-4 mt-3">
            <button
              type="button"
              onClick={handleDemoScan}
              className="w-full py-3 rounded-2xl text-sm font-semibold"
              style={{
                background:
                  "rgba(79,70,229,0.2)",
                color: "#818cf8",
                border:
                  "1px solid rgba(79,70,229,0.3)",
              }}
            >
              Quét demo (vé mặc định)
            </button>
          </div>

          {/* ==============================
              RECENT HISTORY
          ============================== */}
          {history.length > 0 && (
            <div className="px-4 mt-5 pb-6">
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{
                  color: "#334155",
                }}
              >
                Điểm danh gần đây
              </h3>

              <div className="space-y-2">
                {history
                  .slice(0, 3)
                  .map(
                    (
                      historyItem,
                      index
                    ) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl"
                        style={{
                          background:
                            "rgba(255,255,255,0.04)",
                          border:
                            "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background:
                                historyItem.status ===
                                "success"
                                  ? "#059669"
                                  : "#dc2626",
                            }}
                          >
                            {historyItem.status ===
                            "success" ? (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={
                                  3
                                }
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m4.5 12.75 6 6 9-13.5"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={
                                  3
                                }
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18 18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-white">
                              {
                                historyItem.name
                              }
                            </p>

                            <p
                              className="text-xs"
                              style={{
                                color:
                                  "#475569",
                                fontFamily:
                                  "monospace",
                              }}
                            >
                              {
                                historyItem.studentId
                              }
                            </p>
                          </div>
                        </div>

                        <span
                          className="text-xs"
                          style={{
                            color:
                              "#334155",
                            fontFamily:
                              "monospace",
                          }}
                        >
                          {
                            historyItem.time
                          }
                        </span>
                      </div>
                    )
                  )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ==============================
           HISTORY TAB
        ============================== */
        <div className="flex-1 px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base text-white">
              Lịch sử điểm danh
            </h2>

            <span
              className="text-xs"
              style={{
                color: "#475569",
                fontFamily:
                  "monospace",
              }}
            >
              {
                history.filter(
                  (historyItem) =>
                    historyItem.status ===
                    "success"
                ).length
              }{" "}
              thành công
            </span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <p
                className="text-sm"
                style={{
                  color: "#334155",
                }}
              >
                Chưa có lịch sử điểm danh
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(
                (
                  historyItem,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{
                      background:
                        "rgba(255,255,255,0.05)",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          historyItem.status ===
                          "success"
                            ? "rgba(5,150,105,0.2)"
                            : "rgba(220,38,38,0.2)",
                      }}
                    >
                      {historyItem.status ===
                      "success" ? (
                        <svg
                          className="w-4 h-4"
                          style={{
                            color:
                              "#059669",
                          }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          style={{
                            color:
                              "#dc2626",
                          }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {
                          historyItem.name
                        }
                      </p>

                      <p
                        className="text-xs"
                        style={{
                          color:
                            "#475569",
                          fontFamily:
                            "monospace",
                        }}
                      >
                        {
                          historyItem.studentId
                        }{" "}
                        ·{" "}
                        {
                          historyItem.time
                        }
                      </p>

                      {historyItem.message && (
                        <p
                          className="text-xs mt-0.5"
                          style={{
                            color:
                              "#dc2626",
                          }}
                        >
                          {
                            historyItem.message
                          }
                        </p>
                      )}
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{
                        background:
                          historyItem.status ===
                          "success"
                            ? "rgba(5,150,105,0.15)"
                            : "rgba(220,38,38,0.15)",

                        color:
                          historyItem.status ===
                          "success"
                            ? "#059669"
                            : "#dc2626",
                      }}
                    >
                      {historyItem.status ===
                      "success"
                        ? "Thành công"
                        : "Thất bại"}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ==============================
          RESULT OVERLAY
      ============================== */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{
            background:
              result.success
                ? "rgba(5,150,105,0.97)"
                : "rgba(220,38,38,0.97)",
          }}
        >
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background:
                  "rgba(255,255,255,0.2)",
              }}
            >
              {result.success ? (
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0L22.303 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              )}
            </div>

            {result.success ? (
              <>
                <h2 className="font-bold text-2xl text-white mb-3">
                  Điểm danh thành công!
                </h2>

                <p
                  className="text-xl font-semibold mb-1"
                  style={{
                    color: "#d1fae5",
                  }}
                >
                  {result.studentName}
                </p>

                <p
                  className="text-sm mb-0.5"
                  style={{
                    color: "#a7f3d0",
                    fontFamily:
                      "monospace",
                  }}
                >
                  MSSV: {result.studentId}
                </p>

                {result.faculty && (
                  <p
                    className="text-sm"
                    style={{
                      color:
                        "#a7f3d0",
                    }}
                  >
                    {result.faculty}
                  </p>
                )}

                {result.time && (
                  <p
                    className="text-sm mt-1"
                    style={{
                      color:
                        "#6ee7b7",
                      fontFamily:
                        "monospace",
                    }}
                  >
                    Thời gian:{" "}
                    {result.time}
                  </p>
                )}

                <p
                  className="text-sm mt-2"
                  style={{
                    color: "#a7f3d0",
                  }}
                >
                  Đã ghi nhận vào hệ thống
                </p>

                <p className="text-xs mt-4 opacity-60 text-white">
                  Tự động đóng sau 2 giây...
                </p>
              </>
            ) : (
              <>
                <h2 className="font-bold text-2xl text-white mb-3">
                  Không thể điểm danh
                </h2>

                <p
                  className="text-base mb-8"
                  style={{
                    color: "#fecaca",
                  }}
                >
                  {result.message}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setResult(null)
                  }
                  className="px-8 py-3 rounded-2xl text-sm font-bold"
                  style={{
                    background:
                      "white",
                    color:
                      "#dc2626",
                  }}
                >
                  Quét lại
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Staff/Organizer có thể quay về các trang khác */}
      <BottomNav
        showCheckin={true}
        dark={true}
      />
    </div>
  );
}