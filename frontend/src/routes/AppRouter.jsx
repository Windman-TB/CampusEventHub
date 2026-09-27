import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";
import EventDetailPage from "../pages/EventDetailPage";
import TicketPage from "../pages/TicketPage";
import ProfilePage from "../pages/ProfilePage";
import CheckInPage from "../pages/CheckInPage";
import DashboardPage from "../pages/DashboardPage";
import EventManagementPage from "../pages/EventManagementPage";
import EventFormPage from "../pages/EventFormPage";
import ParticipantsPage from "../pages/ParticipantsPage";
import StaffPage from "../pages/StaffPage";
import LoginPage from "../pages/LoginPage";
import TicketConfirmPage from "../pages/TicketConfirmPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root → redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Student routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/tickets" element={<TicketPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/ticket-confirm" element={<TicketConfirmPage />} />

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