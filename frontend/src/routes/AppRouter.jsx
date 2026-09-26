import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";
import EventDetailPage from "../pages/EventDetailPage";
import TicketPage from "../pages/TicketPage";
import CheckInPage from "../pages/CheckInPage";
import DashboardPage from "../pages/DashboardPage";
import EventManagementPage from "../pages/EventManagementPage";
import EventFormPage from "../pages/EventFormPage";
import ParticipantsPage from "../pages/ParticipantsPage";
import StaffPage from "../pages/StaffPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/tickets/:ticketId" element={<TicketPage />} />
        <Route path="/check-in" element={<CheckInPage />} />

        {/* Organizer routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/events" element={<EventManagementPage />} />
        <Route path="/dashboard/events/new" element={<EventFormPage />} />
        <Route path="/dashboard/participants" element={<ParticipantsPage />} />
        <Route path="/dashboard/staff" element={<StaffPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;