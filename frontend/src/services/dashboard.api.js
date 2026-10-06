import { apiFetch } from './api.js';

// Dashboard tổng quan
export function fetchDashboardOverview(
  timeRange = 'month'
) {
  return apiFetch(
    `/api/organizer/dashboard/overview?timeRange=${encodeURIComponent(
      timeRange
    )}`
  );
}

// Analytics theo từng sự kiện
export function fetchEventAnalytics(eventId) {
  return apiFetch(
    `/api/organizer/events/${eventId}/analytics`
  );
}