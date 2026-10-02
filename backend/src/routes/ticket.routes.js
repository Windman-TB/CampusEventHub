const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

const authenticate = require('../middlewares/auth.middleware');

// Lấy danh sách vé của tôi
router.get('/my-tickets', authenticate, ticketController.getMyTickets);

// Đặt vé
router.post('/book', authenticate, ticketController.bookTicket);

// Hủy vé
router.post('/:id/cancel', authenticate, ticketController.cancelTicket);

module.exports = router;
