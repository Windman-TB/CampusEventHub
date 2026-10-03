const ticketService = require('../services/ticket.service');

const bookTicket = async (req, res) => {
    try {
        const { eventId } = req.body;
        // User ID từ middleware xác thực JWT
        const userId = req.user?.id; 

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập"
            });
        }

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID sự kiện"
            });
        }

        const result = await ticketService.bookTicket(userId, eventId);

        return res.status(200).json({
            success: true,
            data: result,
            message: result.message
        });

    } catch (error) {
        console.error("Lỗi controller bookTicket:", error);
        return res.status(400).json({
            success: false,
            error: error.message,
            message: error.message || "Có lỗi xảy ra khi đặt vé"
        });
    }
};

const getMyTickets = async (req, res) => {
    try {
        const userId = req.user?.id;
        const tickets = await ticketService.getMyTickets(userId);
        
        return res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const cancelTicket = async (req, res) => {
    try {
        const userId = req.user?.id;
        const ticketId = req.params.id;
        const result = await ticketService.cancelTicket(userId, ticketId);
        
        return res.status(200).json({
            success: true,
            data: result,
            message: 'Hủy vé thành công'
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    bookTicket,
    getMyTickets,
    cancelTicket
};
