const nodemailer = require('nodemailer');

let transporter;

// Tự động tạo test account trên Ethereal để xem trước Email
nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
}).catch(err => console.error("Không tạo được test account:", err));

const sendTicketEmail = async (userId, eventId, qrCode) => {
    // Trong môi trường thật, sẽ lấy email người dùng từ DB dựa trên userId
    // Tạm thời mock lại
    const mailOptions = {
        from: '"Campus Event Hub" <no-reply@uit.edu.vn>',
        to: 'sinhvien@gm.uit.edu.vn', // Mock email, cần lấy từ db
        subject: 'Xác nhận đặt vé sự kiện thành công',
        html: `
            <h3>Chúc mừng bạn đã đặt vé thành công!</h3>
            <p>Sự kiện ID: ${eventId}</p>
            <p>Mã QR Code bảo mật của bạn: <strong>${qrCode}</strong></p>
            <p>Vui lòng xuất trình mã này khi check-in sự kiện.</p>
        `
    };

    try {
        if (!transporter) throw new Error("Transporter chưa sẵn sàng");
        const info = await transporter.sendMail(mailOptions);
        console.log('-----------------------------------------');
        console.log('📧 Đã mô phỏng gửi Email thành công!');
        console.log('👉 Click vào link này để xem nội dung Email: %s', nodemailer.getTestMessageUrl(info));
        console.log('-----------------------------------------');
        return info;
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        throw error;
    }
};

module.exports = {
    sendTicketEmail,
    transporter
};
