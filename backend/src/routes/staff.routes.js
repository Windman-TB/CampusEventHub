const express = require('express');
const staffCtrl = require('../controllers/staff.controller.js');
const authenticate = require('../middlewares/auth.middleware.js');
const authorizeRoles = require('../middlewares/role.middleware.js');

const router = express.Router();

// Tất cả staff routes yêu cầu đăng nhập + vai trò Ban tổ chức
router.get(
  '/organizer/students/search',
  authenticate,
  authorizeRoles('ToChuc'),
  staffCtrl.searchStudents
);

router.get(
  '/organizer/events/:id/staff',
  authenticate,
  authorizeRoles('ToChuc'),
  staffCtrl.listStaff
);

router.post(
  '/organizer/events/:id/staff',
  authenticate,
  authorizeRoles('ToChuc'),
  staffCtrl.addStaff
);

router.delete(
  '/organizer/events/:id/staff/:staffId',
  authenticate,
  authorizeRoles('ToChuc'),
  staffCtrl.removeStaff
);

module.exports = router;
