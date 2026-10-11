import { useEffect, useState } from 'react';

import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import DashboardChart from '../components/dashboard/DashboardChart';
import { fetchDashboardOverview, fetchEventAnalytics } from '../services/dashboard.api.js';
import { fetchOrganizerEvents } from '../services/api.js';

export default function DashboardPage() {
  // Keep the response associated with its filter to prevent stale data in the UI.
  // This removes synchronous setState calls from the body of useEffect.
  const [dateRange, setDateRange] = useState('month');
  const [overviewResult, setOverviewResult] = useState({
    range: '',
    data: null,
    error: '',
  });

  const overview = overviewResult.range === dateRange ? overviewResult.data : null;
  const loading = overviewResult.range !== dateRange;
  const error = overviewResult.range === dateRange ? overviewResult.error : '';

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  const [analyticsResult, setAnalyticsResult] = useState({
    eventId: '',
    data: null,
    error: '',
  });

  const analyticsIsCurrent =
    Boolean(selectedEventId) && analyticsResult.eventId === selectedEventId;
  const analytics = analyticsIsCurrent ? analyticsResult.data : null;
  const analyticsError = analyticsIsCurrent ? analyticsResult.error : '';
  const analyticsLoading = Boolean(selectedEventId) && !analyticsIsCurrent;

  // 1. Load dashboard overview when the time range changes.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetchDashboardOverview(dateRange);
        if (!cancelled) {
          setOverviewResult({
            range: dateRange,
            data: response?.data ?? null,
            error: '',
          });
        }
      } catch (err) {
        console.error('Load dashboard error:', err);
        if (!cancelled) {
          setOverviewResult({
            range: dateRange,
            data: null,
            error: err?.message || 'Không thể tải dữ liệu dashboard',
          });
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  // 2. Get organizer events; preserve a valid selection if events reload.
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const response = await fetchOrganizerEvents();
        if (cancelled) return;

        const eventList = Array.isArray(response?.data) ? response.data : [];
        setEvents(eventList);
        setEventsError('');
        setSelectedEventId((current) => {
          if (eventList.some((event) => String(event.ma_su_kien) === current)) {
            return current;
          }
          return eventList[0]?.ma_su_kien != null
            ? String(eventList[0].ma_su_kien)
            : '';
        });
      } catch (err) {
        console.error('Load organizer events error:', err);
        if (!cancelled) {
          setEvents([]);
          setSelectedEventId('');
          setEventsError(err?.message || 'Không thể tải danh sách sự kiện');
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    }

    void loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  // 3. Fetch analytics for the selected event. Previous responses are ignored
  // when the event changes or this page unmounts.
  useEffect(() => {
    if (!selectedEventId) return undefined;

    let cancelled = false;

    async function loadAnalytics() {
      try {
        const response = await fetchEventAnalytics(selectedEventId);
        if (!cancelled) {
          setAnalyticsResult({
            eventId: selectedEventId,
            data: response?.data ?? null,
            error: '',
          });
        }
      } catch (err) {
        console.error('Load event analytics error:', err);
        if (!cancelled) {
          setAnalyticsResult({
            eventId: selectedEventId,
            data: null,
            error: err?.message || 'Không thể tải dữ liệu phân tích sự kiện',
          });
        }
      }
    }

    void loadAnalytics();
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
              onChange={(e) => {
                // Invalidate the previous result before requesting another range.
                setOverviewResult({ range: '', data: null, error: '' });
                setDateRange(e.target.value);
              }}
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
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                // Reset cached analytics to avoid briefly showing an old event.
                setAnalyticsResult({ eventId: '', data: null, error: '' });
              }}
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
