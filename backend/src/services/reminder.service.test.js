require('dotenv').config();

const {
  sendTomorrowEventReminders,
  sendEventRemindersForDate,
} = require('./reminder.service');

async function run() {
  console.log(
    '=============================='
  );

  console.log(
    'Campus Event Hub Reminder Test'
  );

  console.log(
    '=============================='
  );

  // Nếu có REMINDER_TEST_DATE
  // thì test event của ngày đó.
  // Nếu không có thì tự tìm event ngày mai.
  const testDate =
    process.env.REMINDER_TEST_DATE;

  let result;

  if (testDate) {
    console.log(
      'Test date:',
      testDate
    );

    result =
      await sendEventRemindersForDate(
        testDate
      );
  } else {
    console.log(
      'Mode: tomorrow'
    );

    result =
      await sendTomorrowEventReminders();
  }

  console.log('');
  console.log(
    'Reminder result:',
    result
  );

  console.log(
    'Reminder test hoàn tất'
  );
}

run().catch((error) => {
  console.error(
    'REMINDER TEST FAILED'
  );

  console.error(error);

  process.exitCode = 1;
});
  