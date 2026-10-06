import { apiFetch } from "./api";

export function fetchAssignedEvents() {
  return apiFetch("/api/check-in/assigned-events");
}

export function scanTicket({ eventId, qrCode }) {
  return apiFetch("/api/check-in/scan", {
    method: "POST",
    body: JSON.stringify({
      ma_su_kien: eventId,
      ma_qr_code: qrCode,
    }),
  });
}

export function fetchCheckInHistory({
  eventId,
  limit = 20,
  cursor,
}) {
  const params = new URLSearchParams({
    eventId: String(eventId),
    limit: String(limit),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiFetch(
    `/api/check-in/history?${params.toString()}`
  );
}
