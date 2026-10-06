const supabasePkg = require('../config/supabase.js');
const supabase =
  supabasePkg.supabase || supabasePkg;

const VALID_TIME_RANGES = [
  'today',
  'week',
  'month',
  'year',
];

// ==========================================
// DASHBOARD OVERVIEW
// ==========================================

const getDashboardOverview = async (
  organizerId,
  timeRange = 'month'
) => {
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    const error = new Error(
      'timeRange chỉ hỗ trợ today, week, month hoặc year'
    );

    error.status = 400;
    throw error;
  }

  const { data, error } = await supabase.rpc(
    'get_dashboard_overview',
    {
      p_organizer_id: organizerId,
      p_time_range: timeRange,
    }
  );

  if (error) {
    throw error;
  }

  return data;
};


// ==========================================
// EVENT ANALYTICS
// ==========================================

const getEventAnalytics = async (
  organizerId,
  eventId
) => {
  const { data, error } = await supabase.rpc(
    'get_event_analytics',
    {
      p_organizer_id: organizerId,
      p_event_id: eventId,
    }
  );

  if (error) {
    throw error;
  }

  if (
    !data ||
    data.success === false
  ) {
    const notFoundError = new Error(
      'Không tìm thấy sự kiện hoặc bạn không có quyền xem thống kê sự kiện này'
    );

    notFoundError.status = 404;
    throw notFoundError;
  }

  // Không cần gửi field success bên trong data
  const {
    success,
    ...analytics
  } = data;

  return analytics;
};


module.exports = {
  getDashboardOverview,
  getEventAnalytics,
};