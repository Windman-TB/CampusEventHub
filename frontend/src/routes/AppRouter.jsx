import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";
import EventDetailPage from "../pages/EventDetailPage";
import TicketPage from "../pages/TicketPage";
import CheckInPage from "../pages/CheckInPage";
import DashboardPage from "../pages/DashboardPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/tickets/:ticketId" element={<TicketPage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;