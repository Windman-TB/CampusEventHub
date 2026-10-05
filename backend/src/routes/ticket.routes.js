const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Lấy danh sách vé của tôi
router.get(
  '/my-tickets',
  authenticate,
  authorizeRoles('SinhVien'),
  ticketController.getMyTickets
);

// Đặt vé
router.post('/book', authenticate, authorizeRoles('SinhVien'), ticketController.bookTicket);

// Hủy vé
router.post(
  '/:id/cancel',
  authenticate,
  authorizeRoles('SinhVien'),
  ticketController.cancelTicket
);

module.exports = router;
