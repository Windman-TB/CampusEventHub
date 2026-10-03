require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");

const supabase = require("./config/supabase");

// Routes
const eventRoutes = require("./routes/event.routes.js");
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const participantRoutes = require("./routes/participants.routes.js");
const staffRoutes = require("./routes/staff.routes.js");
const ticketRoutes = require("./routes/ticket.routes.js");

// Error handlers
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/error.middleware");

const app = express();

// ==============================
// Middleware
// ==============================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ==============================
// Health Check
// ==============================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Campus Event Hub API is running",
  });
});

// ==============================
// Database Health Check
// ==============================

app.get("/api/health/db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chuyen_de")
      .select("ma_chuyen_de, ten_chuyen_de")
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      status: "ok",
      message: "Database connection successful",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ==============================
// Routes
// ==============================

// Event module từ main
app.use("/api", eventRoutes);

// Auth module
app.use("/api/auth", authRoutes);

// Profile module
app.use("/api/profile", profileRoutes);

// Participants & Ticket management (Gói 7 - Phase 1)
app.use("/api", participantRoutes);

// Staff management (Gói 7 - Phase 2)
app.use("/api", staffRoutes);

// Ticket Booking (Gói 4)
app.use("/api/tickets", ticketRoutes);

// ==============================
// Error Handling
// PHẢI LUÔN ĐẶT CUỐI CÙNG
// ==============================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;