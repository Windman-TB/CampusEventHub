const nodemailer = require("nodemailer");

let transporter = null;

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
      "Thiếu cấu hình SMTP trong environment variables"
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

async function sendPasswordResetOtp(email, otp) {
  const deliveryMode =
    process.env.OTP_DELIVERY_MODE || "console";

  if (deliveryMode === "console") {
    console.log(
      `[DEV OTP] Password reset OTP for ${email}: ${otp}`
    );
    return;
  }

  const mailTransporter = getTransporter();

  try {
    const info = await mailTransporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER,

      to: email,

      subject:
        "Campus Event Hub - Mã OTP đặt lại mật khẩu",

      text:
        `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. ` +
        `Mã có hiệu lực trong 10 phút. ` +
        `Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    });

    console.log(
      "OTP email sent:",
      info.messageId
    );
  } catch (error) {
    console.error("SMTP SEND ERROR:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });

    throw error;
  }
}

module.exports = {
  sendPasswordResetOtp,
};