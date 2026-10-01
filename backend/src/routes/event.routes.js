const express = require('express');
const eventCtrl = require('../controllers/event.controller.js');
const authenticate = require('../middlewares/auth.middleware.js');
const authorizeRoles = require('../middlewares/role.middleware.js');

const router = express.Router();

// Public: Lấy chuyên đề & xem chi tiết sự kiện
router.get('/categories', eventCtrl.getCategories);
router.get('/events/:id', eventCtrl.getEventById);

// Organizer: Quản lý sự kiện (Yêu cầu đăng nhập + vai trò ToChuc)
router.get(
  '/organizer/events',
  authenticate,
  authorizeRoles('ToChuc'),
  eventCtrl.getOrganizerEvents
);

router.post(
  '/events',
  authenticate,
  authorizeRoles('ToChuc'),
  eventCtrl.createEvent
);

router.put(
  '/events/:id',
  authenticate,
  authorizeRoles('ToChuc'),
  eventCtrl.updateEvent
);

router.delete(
  '/events/:id',
  authenticate,
  authorizeRoles('ToChuc'),
  eventCtrl.deleteEvent
);

module.exports = router;