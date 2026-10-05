import { useEffect, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import DashboardChart from '../components/dashboard/DashboardChart';

import {
  fetchDashboardOverview,
  fetchEventAnalytics,
} from '../services/dashboard.api.js';

import {
  fetchOrganizerEvents,
} from '../services/api.js';

export default function DashboardPage() {
  // =========================================================
  // OVERVIEW
  // =========================================================
  const [dateRange, setDateRange] = useState('month');

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================================================
  // EVENT ANALYTICS
  // =========================================================
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  const [selectedEventId, setSelectedEventId] = useState('');

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  // =========================================================
  // 1. LOAD DASHBOARD OVERVIEW
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const response = await fetchDashboardOverview(dateRange);

        if (!cancelled) {
          setOverview(response?.data ?? null);
        }
      } catch (err) {
        console.error('Load dashboard error:', err);

        if (!cancelled) {
          setOverview(null);

          setError(
            err.message ||
              'Không thể tải dữ liệu dashboard'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  // =========================================================
  // 2. LOAD DANH SÁCH SỰ KIỆN CỦA BTC
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        setEventsLoading(true);
        setEventsError('');

        const response = await fetchOrganizerEvents();

        const eventList = Array.isArray(response?.data)
          ? response.data
          : [];

        if (cancelled) {
          return;
        }

        setEvents(eventList);

        if (eventList.length > 0) {
          setSelectedEventId(
            String(eventList[0].ma_su_kien)
          );
        } else {
          setSelectedEventId('');
          setAnalytics(null);
        }
      } catch (err) {
        console.error(
          'Load organizer events error:',
          err
        );

        if (!cancelled) {
          setEvents([]);
          setSelectedEventId('');

          setEventsError(
            err.message ||
              'Không thể tải danh sách sự kiện'
          );
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // 3. LOAD ANALYTICS THEO EVENT ĐƯỢC CHỌN
  // =========================================================
  useEffect(() => {
    if (!selectedEventId) {
      setAnalytics(null);
      setAnalyticsError('');
      return undefined;
    }

    let cancelled = false;

    async function loadAnalytics() {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError('');
        setAnalytics(null);

        const response =
          await fetchEventAnalytics(
            selectedEventId
          );

        if (!cancelled) {
          setAnalytics(response?.data ?? null);
        }
      } catch (err) {
        console.error(
          'Load event analytics error:',
          err
        );

        if (!cancelled) {
          setAnalytics(null);

          setAnalyticsError(
            err.message ||
              'Không thể tải dữ liệu phân tích sự kiện'
          );
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="font-bold text-2xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#1a1a2e',
              }}
            >
              Tổng quan hệ thống
            </h1>

            <p
              className="text-sm mt-1"
              style={{ color: '#64748b' }}
            >
              Theo dõi các số liệu hoạt động chính
            </p>
          </div>

          {/* TIME RANGE */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: '#475569' }}
            >
              Thời gian:
            </span>

            <select
              value={dateRange}
              onChange={(e) =>
                setDateRange(e.target.value)
              }
              className="px-3 py-2 rounded-xl text-sm font-medium border outline-none bg-white transition-colors hover:bg-slate-50 cursor-pointer"
              style={{
                borderColor: '#e2e8f0',
                color: '#1a1a2e',
              }}
            >
              <option value="today">
                Hôm nay
              </option>

              <option value="week">
                Tuần này
              </option>

              <option value="month">
                Tháng này
              </option>

              <option value="year">
                Năm học
              </option>
            </select>
          </div>
        </div>

        {/* =====================================================
            OVERVIEW ERROR
        ===================================================== */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* =====================================================
            STAT CARDS
        ===================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">

          {/* TOTAL EVENTS */}
          <StatCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 00 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
              />
            }
            label="Tổng số sự kiện"
            value={
              loading
                ? '...'
                : overview?.totalEvents ?? 0
            }
            color="#4f46e5"
            bg="#eef2ff"
          />

          {/* TOTAL REGISTRATIONS */}
          <StatCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1-5.25 0Z"
              />
            }
            label="Tổng lượt vé đăng ký"
            value={
              loading
                ? '...'
                : overview?.totalRegistrations ?? 0
            }
            color="#0891b2"
            bg="#ecfeff"
          />

          {/* FILL RATE */}
          <StatCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25v3.75m0-3.75h3.75m-3.75 0V12m3.75 4.5h3.75m0 0v3.75m0-3.75V12m3.75 4.5h.008v.008h-.008v-.008Z"
              />
            }
            label="Tỷ lệ lấp đầy"
            value={
              loading
                ? '...'
                : `${overview?.fillRate ?? 0}%`
            }
            color="#d97706"
            bg="#fef3c7"
          />

          {/* CHECK-IN RATE */}
          <StatCard
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            }
            label="Tỷ lệ check-in"
            value={
              loading
                ? '...'
                : `${overview?.checkInRate ?? 0}%`
            }
            color="#059669"
            bg="#dcfce7"
          />
        </div>

        {/* =====================================================
            EVENT ANALYTICS HEADER
        ===================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2
              className="font-semibold text-lg"
              style={{
                fontFamily: 'var(--font-display)',
                color: '#1a1a2e',
              }}
            >
              Phân tích sự kiện
            </h2>

            <p
              className="text-sm mt-1"
              style={{ color: '#64748b' }}
            >
              Xem thống kê chi tiết theo từng sự kiện
            </p>
          </div>

          {/* EVENT SELECT */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: '#475569' }}
            >
              Sự kiện:
            </span>

            <select
              value={selectedEventId}
              onChange={(e) =>
                setSelectedEventId(
                  e.target.value
                )
              }
              disabled={
                eventsLoading ||
                events.length === 0
              }
              className="px-3 py-2 rounded-xl text-sm font-medium border outline-none bg-white transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: '#e2e8f0',
                color: '#1a1a2e',
              }}
            >
              {eventsLoading && (
                <option value="">
                  Đang tải sự kiện...
                </option>
              )}

              {!eventsLoading &&
                events.length === 0 && (
                  <option value="">
                    Chưa có sự kiện
                  </option>
                )}

              {!eventsLoading &&
                events.map((event) => (
                  <option
                    key={event.ma_su_kien}
                    value={event.ma_su_kien}
                  >
                    {event.ten_su_kien}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* =====================================================
            EVENT LIST ERROR
        ===================================================== */}
        {eventsError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            {eventsError}
          </div>
        )}

        {/* =====================================================
            ANALYTICS ERROR
        ===================================================== */}
        {analyticsError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            {analyticsError}
          </div>
        )}

        {/* =====================================================
            ANALYTICS CONTENT
        ===================================================== */}
        {analyticsLoading ? (
          <div
            className="bg-white rounded-2xl p-6 shadow-sm border text-sm"
            style={{
              borderColor: '#f1f5f9',
              color: '#64748b',
            }}
          >
            Đang tải dữ liệu phân tích...
          </div>
        ) : analytics ? (
          <DashboardChart
            analytics={analytics}
          />
        ) : (
          <div
            className="bg-white rounded-2xl p-6 shadow-sm border text-sm"
            style={{
              borderColor: '#f1f5f9',
              color: '#64748b',
            }}
          >
            {eventsLoading
              ? 'Đang tải danh sách sự kiện...'
              : events.length === 0
                ? 'Ban tổ chức chưa có sự kiện để phân tích.'
                : 'Chưa có dữ liệu phân tích.'}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}