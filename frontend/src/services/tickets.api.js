import { apiFetch } from "./api";

export function fetchMyTickets() {
  return apiFetch("/api/tickets/my-tickets");
}

export function cancelTicket(ticketId) {
  return apiFetch(
    `/api/tickets/${ticketId}/cancel`,
    {
      method: "POST",
    }
  );
}
