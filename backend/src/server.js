require("dotenv").config();

const app = require("./app");

const {
  startReminderJob,
} = require("./jobs/reminder.job");

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server is running on port ${PORT}`
  );

  startReminderJob();
});