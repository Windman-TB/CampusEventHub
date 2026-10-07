const {
  sendTomorrowEventReminders,
} = require('../../src/services/reminder.service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    req.headers.authorization !== `Bearer ${cronSecret}`
  ) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    const result =
      await sendTomorrowEventReminders();

    return res.status(200).json({
      success: result.failed === 0,
      message: 'Reminder job completed',
      data: result,
    });
  } catch (error) {
    console.error(
      '[Vercel Cron] Reminder failed:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Reminder job failed',
      error: error.message,
    });
  }
};
