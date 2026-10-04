const dashboardService = require('../services/dashboard.service.js');

const getOverview = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardOverview(req.user.id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
};