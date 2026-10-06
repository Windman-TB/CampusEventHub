require('dotenv').config();

const {
  sendBookingConfirmation,
  sendEventReminder,
} = require('./mail.service');

const testEvent = {
  ma_su_kien: 999,
  ten_su_kien: 'Workshop Data Engineering',
  ngay_dien_ra: '2026-10-06',
  thoi_gian_bat_dau: '08:00:00',
  thoi_gian_ket_thuc: '11:00:00',
  dia_diem: 'UIT - ĐHQG TP.HCM',
  phong: 'E1.1',
};

const testTicket = {
  ticketId: 999,
  qrCode: 'CAMPUS-EVENT-HUB-TEST-QR-999',
};

async function run() {
  const recipient =
    process.env.MAIL_TEST_TO ||
    process.env.SMTP_USER;

  if (!recipient) {
    throw new Error(
      'Thiếu MAIL_TEST_TO hoặc SMTP_USER trong .env'
    );
  }

  const mode =
    process.env.MAIL_TEST_MODE ||
    'booking';

  console.log('==========================');
  console.log('Campus Event Hub SMTP Test');
  console.log('==========================');
  console.log('Recipient:', recipient);
  console.log('Mode:', mode);

  if (mode === 'booking' || mode === 'all') {
    const info = await sendBookingConfirmation(
      recipient,
      testEvent,
      testTicket
    );

    console.log(
      'Booking email sent:',
      info.messageId
    );
  }

  if (mode === 'reminder' || mode === 'all') {
    const info = await sendEventReminder(
      recipient,
      testEvent,
      testTicket
    );

    console.log(
      'Reminder email sent:',
      info.messageId
    );
  }
}

run()
  .then(() => {
    console.log('SMTP test hoàn tất');
    process.exit(0);
  })
  .catch((error) => {
    console.error('SMTP TEST FAILED');
    console.error({
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
    });
    process.exit(1);
  });