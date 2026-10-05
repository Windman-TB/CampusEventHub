const cron = require('node-cron');

const {
  sendTomorrowEventReminders,
} = require('../services/reminder.service');

// Chạy reminder một lần.
// Tách riêng để có thể test thủ công.
async function runReminderJobOnce() {
  console.log(
    '[Reminder Job] Bắt đầu kiểm tra sự kiện ngày mai...'
  );

  try {
    const result =
      await sendTomorrowEventReminders();

    console.log(
      '[Reminder Job] Hoàn tất:',
      result
    );

    return result;
  } catch (error) {
    console.error(
      '[Reminder Job] Lỗi:',
      error.message
    );

    throw error;
  }
}

// Khởi động cron job.
// 08:00 mỗi ngày theo giờ Việt Nam.
function startReminderJob() {
  const task = cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        await runReminderJobOnce();
      } catch {
        // Đã log trong runReminderJobOnce().
        // Không để lỗi reminder làm crash server.
      }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh',
      noOverlap: true,
    }
  );

  console.log(
    '[Reminder Job] Scheduler đã bật: 08:00 mỗi ngày - Asia/Ho_Chi_Minh'
  );

  return task;
}

module.exports = {
  runReminderJobOnce,
  startReminderJob,
};