require("dotenv").config(); 

const express = require("express");
const cors = require("cors");
const supabase = require("./config/supabase");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Campus Event Hub API is running",
    });
});

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

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});