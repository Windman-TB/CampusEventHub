const dashboardService =
  require('../services/dashboard.service.js');


// ==========================================
// GET /api/organizer/dashboard/overview
// ==========================================

const getOverview = async (
  req,
  res,
  next
) => {
  try {
    const organizerId = req.user.id;

    const timeRange =
      req.query.timeRange || 'month';

    const data =
      await dashboardService
        .getDashboardOverview(
          organizerId,
          timeRange
        );

    return res.status(200).json({
      success: true,
      data,
      message:
        'Lấy dữ liệu dashboard thành công',
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET /api/organizer/events/:id/analytics
// ==========================================

const getEventAnalytics = async (
  req,
  res,
  next
) => {
  try {
    const organizerId = req.user.id;

    const eventId =
      Number(req.params.id);

    if (
      !Number.isInteger(eventId) ||
      eventId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'ID sự kiện không hợp lệ',
      });
    }

    const data =
      await dashboardService
        .getEventAnalytics(
          organizerId,
          eventId
        );

    return res.status(200).json({
      success: true,
      data,
      message:
        'Lấy dữ liệu phân tích sự kiện thành công',
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getOverview,
  getEventAnalytics,
};