const express = require('express');
const router = express.Router();
const dashboardCtrl = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// GET /api/organizer/dashboard-stats
// Trả về số liệu thống kê cho Dashboard của Ban Tổ Chức
router.get(
  '/organizer/dashboard-stats',
  authenticate,
  authorizeRoles('ToChuc'),
  dashboardCtrl.getDashboardStats
);

module.exports = router;
