const ticketService = require('../services/ticket.service');

function sendTicketError(res, error) {
    const statusByCode = {
        VALIDATION_ERROR: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        INVALID_TICKET: 404,
        CANCELLATION_NOT_ALLOWED: 409,
        TICKET_ALREADY_CANCELLED: 409,
        INTERNAL_ERROR: 500
    };

    return res.status(statusByCode[error.code] || 400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra',
        error: {
            code: error.code || 'TICKET_ERROR'
        }
    });
}

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
            message: 'Danh sách vé của tôi',
            data: tickets
        });
    } catch (error) {
        return sendTicketError(res, error);
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
        return sendTicketError(res, error);
    }
};

module.exports = {
    bookTicket,
    getMyTickets,
    cancelTicket
};
