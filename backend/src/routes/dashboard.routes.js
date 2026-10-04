const express = require('express');
const dashboardCtrl = require('../controllers/dashboard.controller.js');
const authenticate = require('../middlewares/auth.middleware.js');
const authorizeRoles = require('../middlewares/role.middleware.js');

const router = express.Router();

router.get(
  '/organizer/dashboard/overview',
  authenticate,
  authorizeRoles('ToChuc'),
  dashboardCtrl.getOverview
);

module.exports = router;