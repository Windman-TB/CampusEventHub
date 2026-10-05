const supabase = require('../config/supabase');

const getDashboardStats = async (req, res) => {
  try {
    const organizerId = req.user.tai_khoan_id;

    // 1. Lấy tất cả sự kiện do người này tổ chức
    const { data: events, error: eventError } = await supabase
      .from('su_kien')
      .select('ma_su_kien, trang_thai, ten_su_kien')
      .eq('nguoi_to_chuc', organizerId);

    if (eventError) throw eventError;

    // Đếm số sự kiện đang diễn ra
    const activeEventsCount = events.filter(
      (e) => e.trang_thai === 'DangDienRa'
    ).length;

    // 2. Lấy dữ liệu đăng ký (vé) của tất cả các sự kiện này
    const eventIds = events.map((e) => e.ma_su_kien);
    let totalParticipants = 0;
    let checkedInCount = 0;
    let attendanceRate = 0;

    if (eventIds.length > 0) {
      const { data: tickets, error: ticketError } = await supabase
        .from('dang_ky')
        .select('trang_thai_ve')
        .in('ma_su_kien', eventIds);

      if (ticketError) throw ticketError;

      const validTickets = tickets.filter(
        (t) => t.trang_thai_ve === 'DaDangKy' || t.trang_thai_ve === 'DaCheckIn'
      );
      totalParticipants = validTickets.length;
      checkedInCount = tickets.filter((t) => t.trang_thai_ve === 'DaCheckIn').length;

      if (totalParticipants > 0) {
        attendanceRate = ((checkedInCount / totalParticipants) * 100).toFixed(1);
      }
    }

    // 3. Tính toán số liệu biểu đồ cho Dashboard
    const chartBarData = [];
    const chartPieData = [];
    
    // Group ticket data by event
    events.forEach(event => {
      const eventTickets = tickets ? tickets.filter(t => t.ma_su_kien === event.ma_su_kien) : [];
      const registered = eventTickets.filter(t => t.trang_thai_ve === 'DaDangKy' || t.trang_thai_ve === 'DaCheckIn').length;
      const checkin = eventTickets.filter(t => t.trang_thai_ve === 'DaCheckIn').length;
      
      // Giới hạn tên sự kiện ngắn gọn (max 20 chars)
      const shortTitle = event.ten_su_kien?.substring(0, 20) + (event.ten_su_kien?.length > 20 ? '...' : '') || `Sự kiện ${event.ma_su_kien}`;
      
      chartBarData.push({
        event: shortTitle,
        registered,
        checkin
      });

      if (checkin > 0) {
        chartPieData.push({
          name: shortTitle,
          value: checkin
        });
      }
    });

    // Dummy Line data for weekly trend (Since we don't have ticket timestamps readily queried)
    const chartLineData = [
      { date: 'T2', registered: 10, checkin: 8 },
      { date: 'T3', registered: 20, checkin: 15 },
      { date: 'T4', registered: 30, checkin: 28 },
      { date: 'T5', registered: 45, checkin: 40 },
      { date: 'T6', registered: 60, checkin: 55 },
      { date: 'T7', registered: 75, checkin: 70 },
      { date: 'CN', registered: Math.round(totalParticipants), checkin: Math.round(checkedInCount) },
    ];

    return res.status(200).json({
      success: true,
      data: {
        activeEvents: activeEventsCount,
        totalParticipants,
        attendanceRate: Number(attendanceRate),
        averageRating: 4.8,
        charts: {
          bar: chartBarData,
          pie: chartPieData.length > 0 ? chartPieData : [{ name: 'Chưa có data', value: 1 }],
          line: chartLineData
        }
      }
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu thống kê',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};
