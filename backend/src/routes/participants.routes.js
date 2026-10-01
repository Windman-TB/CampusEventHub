const express = require('express');
const participantsCtrl = require('../controllers/participants.controller.js');
const authenticate = require('../middlewares/auth.middleware.js');
const authorizeRoles = require('../middlewares/role.middleware.js');

const router = express.Router();

// GET /api/organizer/events/:id/participants
// Lấy danh sách người tham gia (filter status, search mssv/tên, phân trang)
router.get(
  '/organizer/events/:id/participants',
  authenticate,
  authorizeRoles('ToChuc'),
  participantsCtrl.listParticipants
);

// PATCH /api/organizer/tickets/:id/status
// Đổi trạng thái vé thủ công
router.patch(
  '/organizer/tickets/:id/status',
  authenticate,
  authorizeRoles('ToChuc'),
  participantsCtrl.patchTicketStatus
);

module.exports = router;
