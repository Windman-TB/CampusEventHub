const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const supabase = require('../config/supabase');

let transporter = null;

// ============================================================
// SMTP TRANSPORTER
// ============================================================

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASSWORD
  ) {
    throw new Error(
      'Thiếu cấu hình SMTP trong environment variables'
    );
  }

  const port = Number(SMTP_PORT);

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,

    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
}

// ============================================================
// FORMAT DATE / TIME
// ============================================================

function formatEventDate(date) {
  if (!date) {
    return 'Chưa cập nhật';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
  }).format(
    new Date(`${date}T00:00:00`)
  );
}

function formatEventTime(time) {
  if (!time) {
    return 'Chưa cập nhật';
  }

  return String(time).slice(0, 5);
}

// ============================================================
// BOOKING CONFIRMATION
// ============================================================

async function sendBookingConfirmation(
  email,
  eventInfo,
  ticketInfo
) {
  if (!email) {
    throw new Error(
      'Không có email người nhận'
    );
  }

  if (!eventInfo) {
    throw new Error(
      'Không có thông tin sự kiện'
    );
  }

  if (!ticketInfo?.qrCode) {
    throw new Error(
      'Không có mã QR của vé'
    );
  }

  const mailTransporter =
    getTransporter();

  // Tạo ảnh QR PNG thật
  const qrBuffer =
    await QRCode.toBuffer(
      ticketInfo.qrCode,
      {
        type: 'png',
        width: 320,
        margin: 2,
      }
    );

  const eventName =
    eventInfo.ten_su_kien ||
    'Sự kiện Campus Event Hub';

  const eventDate =
    formatEventDate(
      eventInfo.ngay_dien_ra
    );

  const startTime =
    formatEventTime(
      eventInfo.thoi_gian_bat_dau
    );

  const endTime =
    formatEventTime(
      eventInfo.thoi_gian_ket_thuc
    );

  const location =
    [
      eventInfo.dia_diem,
      eventInfo.phong,
    ]
      .filter(Boolean)
      .join(' - ') ||
    'Chưa cập nhật';

  const info =
    await mailTransporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER,

      to: email,

      subject:
        `Xác nhận đăng ký - ${eventName}`,

      text: `
Bạn đã đăng ký sự kiện thành công.

Sự kiện: ${eventName}
Ngày: ${eventDate}
Thời gian: ${startTime} - ${endTime}
Địa điểm: ${location}

Mã vé: ${ticketInfo.ticketId || 'N/A'}
QR Code: ${ticketInfo.qrCode}

Vui lòng mang theo mã QR để check-in.
      `.trim(),

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            color: #1e293b;
          "
        >
          <h2
            style="
              color: #4f46e5;
              margin-bottom: 8px;
            "
          >
            Đăng ký sự kiện thành công
          </h2>

          <p>
            Bạn đã đăng ký thành công sự kiện:
          </p>

          <h3>
            ${eventName}
          </h3>

          <table
            style="
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            "
          >
            <tr>
              <td
                style="
                  padding: 8px;
                  font-weight: bold;
                "
              >
                Ngày
              </td>

              <td style="padding: 8px;">
                ${eventDate}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  font-weight: bold;
                "
              >
                Thời gian
              </td>

              <td style="padding: 8px;">
                ${startTime} - ${endTime}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  font-weight: bold;
                "
              >
                Địa điểm
              </td>

              <td style="padding: 8px;">
                ${location}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  font-weight: bold;
                "
              >
                Mã vé
              </td>

              <td style="padding: 8px;">
                ${ticketInfo.ticketId || 'N/A'}
              </td>
            </tr>
          </table>

          <div
            style="
              text-align: center;
              margin-top: 24px;
            "
          >
            <p>
              Quét mã QR dưới đây khi check-in:
            </p>

            <img
              src="cid:ticket-qr"
              alt="QR Code"
              width="240"
              height="240"
              style="
                display: block;
                margin: 0 auto;
              "
            />
          </div>

          <p
            style="
              margin-top: 24px;
              color: #64748b;
              font-size: 13px;
            "
          >
            Vui lòng không chia sẻ mã QR này
            với người khác.
          </p>
        </div>
      `,

      attachments: [
        {
          filename: 'ticket-qr.png',
          content: qrBuffer,
          cid: 'ticket-qr',
        },
      ],
    });

  console.log(
    'Booking confirmation email sent:',
    info.messageId
  );

  return info;
}
async function sendTicketEmail(
  userId,
  eventId,
  qrCode
) {
  const { data: user, error: userError } =
    await supabase
      .from('tai_khoan')
      .select('email')
      .eq('ma_tai_khoan', userId)
      .eq('da_xoa', false)
      .single();

  if (userError) throw userError;

  const { data: event, error: eventError } =
    await supabase
      .from('su_kien')
      .select(`
        ma_su_kien,
        ten_su_kien,
        ngay_dien_ra,
        thoi_gian_bat_dau,
        thoi_gian_ket_thuc,
        dia_diem,
        phong
      `)
      .eq('ma_su_kien', eventId)
      .eq('da_xoa', false)
      .single();

  if (eventError) throw eventError;

  const { data: ticket, error: ticketError } =
    await supabase
      .from('dang_ky')
      .select('ma_dang_ky')
      .eq('ma_tai_khoan', userId)
      .eq('ma_su_kien', eventId)
      .eq('ma_qr_code', qrCode)
      .eq('da_xoa', false)
      .single();

  if (ticketError) throw ticketError;

  return sendBookingConfirmation(
    user.email,
    event,
    {
      ticketId: ticket.ma_dang_ky,
      qrCode,
    }
  );
}

// ============================================================
// EVENT REMINDER
// ============================================================

async function sendEventReminder(
  email,
  eventInfo,
  ticketInfo = {}
) {
  if (!email) {
    throw new Error(
      'Không có email người nhận'
    );
  }

  if (!eventInfo) {
    throw new Error(
      'Không có thông tin sự kiện'
    );
  }

  const mailTransporter =
    getTransporter();

  const eventName =
    eventInfo.ten_su_kien ||
    'Sự kiện Campus Event Hub';

  const eventDate =
    formatEventDate(
      eventInfo.ngay_dien_ra
    );

  const startTime =
    formatEventTime(
      eventInfo.thoi_gian_bat_dau
    );

  const location =
    [
      eventInfo.dia_diem,
      eventInfo.phong,
    ]
      .filter(Boolean)
      .join(' - ') ||
    'Chưa cập nhật';

  const info =
    await mailTransporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER,

      to: email,

      subject:
        `Nhắc lịch sự kiện - ${eventName}`,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            color: #1e293b;
          "
        >
          <h2 style="color: #4f46e5;">
            Nhắc lịch sự kiện
          </h2>

          <p>
            Sự kiện bạn đã đăng ký sẽ diễn ra vào ngày mai.
          </p>

          <h3>
            ${eventName}
          </h3>

          <p>
            <strong>Ngày:</strong>
            ${eventDate}
          </p>

          <p>
            <strong>Thời gian:</strong>
            ${startTime}
          </p>

          <p>
            <strong>Địa điểm:</strong>
            ${location}
          </p>

          ${
            ticketInfo.qrCode
              ? `
                <p>
                  Hãy chuẩn bị mã QR vé để check-in.
                </p>
              `
              : ''
          }

          <p
            style="
              margin-top: 24px;
              color: #65748d;
              font-size: 13px;
            "
          >
            Campus Event Hub
          </p>
        </div>
      `,
    });

  console.log(
    'Event reminder email sent:',
    info.messageId
  );

  return info;
}

module.exports = {
  getTransporter,
  sendBookingConfirmation,
  sendTicketEmail,
  sendEventReminder,
};