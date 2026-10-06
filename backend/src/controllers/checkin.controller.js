const checkinService = require("../services/checkin.service.js");

function sendError(res, error) {
  const statusByCode = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INVALID_TICKET: 404,
    WRONG_EVENT: 409,
    TICKET_CANCELLED: 409,
    CHECK_IN_CLOSED: 409,
    ALREADY_CHECKED_IN: 409,
  };

  const status = statusByCode[error.code] || 500;

  return res.status(status).json({
    success: false,
    message: error.message || "Có lỗi xảy ra",
    error: {
      code: error.code || "INTERNAL_ERROR",
    },
    data: error.payload || undefined,
  });
}

async function getAssignedEvents(req, res, next) {
  try {
    const events = await checkinService.getAssignedEvents(req.user);

    return res.status(200).json({
      success: true,
      message: "Danh sách sự kiện được phép soát vé",
      data: events,
    });
  } catch (error) {
    if (error.code) return sendError(res, error);
    return next(error);
  }
}

async function scan(req, res, next) {
  try {
    const result = await checkinService.scanTicket({
      actorId: req.user?.id,
      eventId: req.body?.ma_su_kien,
      qrCode: req.body?.ma_qr_code,
    });

    return res.status(200).json({
      success: true,
      message: "Check-in thành công",
      data: result,
    });
  } catch (error) {
    if (error.code) return sendError(res, error);
    return next(error);
  }
}

async function getHistory(req, res, next) {
  try {
    const result = await checkinService.getHistory({
      actorId: req.user?.id,
      role: req.user?.role,
      eventId: req.query?.eventId,
      limit: req.query?.limit,
      cursor: req.query?.cursor,
    });

    return res.status(200).json({
      success: true,
      message: "Lịch sử check-in",
      data: result,
    });
  } catch (error) {
    if (error.code) return sendError(res, error);
    return next(error);
  }
}

module.exports = {
  getAssignedEvents,
  getHistory,
  scan,
};
