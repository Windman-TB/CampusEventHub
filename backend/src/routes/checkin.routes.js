const express = require('express');
const router = express.Router();
const checkinCtrl = require('../controllers/checkin.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Chỉ Nhân viên điểm danh (hoặc Ban tổ chức) mới được truy cập
router.get(
  '/checkin/events',
  authenticate,
  authorizeRoles('NhanVienCheckIn', 'ToChuc'),
  checkinCtrl.getMyCheckinEvents
);

router.post(
  '/checkin/scan',
  authenticate,
  authorizeRoles('NhanVienCheckIn', 'ToChuc'),
  checkinCtrl.scanQRCode
);

module.exports = router;
