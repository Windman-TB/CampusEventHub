// Mock data cho toàn bộ Frontend – port từ bản nháp UI

export const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Hội thảo Trí tuệ nhân tạo 2026',
    topic: 'academic',
    topicLabel: 'Học thuật',
    description: 'Khám phá các xu hướng mới nhất trong lĩnh vực AI và Machine Learning.',
    date: '2026-10-10',
    startTime: '08:00',
    endTime: '11:30',
    location: 'Trường ĐH Công nghệ Thông tin',
    room: 'Hội trường A',
    capacity: 200,
    registered: 132,
    status: 'open',
    banner: null,
    speaker: 'GS. Nguyễn Văn An',
  },
  {
    id: '2',
    title: 'Workshop Data Engineering',
    topic: 'skill',
    topicLabel: 'Kỹ năng',
    description: 'Thực hành xây dựng pipeline dữ liệu thực tế với Apache Spark.',
    date: '2026-10-20',
    startTime: '13:00',
    endTime: '17:00',
    location: 'UIT',
    room: 'Phòng B204',
    capacity: 60,
    registered: 58,
    status: 'nearly_full',
    banner: null,
    speaker: 'Kỹ sư Trần Minh Tuấn',
  },
  {
    id: '3',
    title: 'Ngày hội Đổi mới sáng tạo',
    topic: 'community',
    topicLabel: 'Cộng đồng',
    description: 'Triển lãm và trình bày các dự án khởi nghiệp sinh viên.',
    date: '2026-11-05',
    startTime: '07:30',
    endTime: '17:00',
    location: 'Sân vận động UIT',
    room: 'Khu A',
    capacity: 500,
    registered: 500,
    status: 'full',
    banner: null,
    speaker: 'Ban tổ chức',
  },
  {
    id: '4',
    title: 'Tọa đàm Kỹ năng mềm',
    topic: 'skill',
    topicLabel: 'Kỹ năng',
    description: 'Chia sẻ bí quyết phát triển kỹ năng giao tiếp và làm việc nhóm.',
    date: '2026-09-15',
    startTime: '14:00',
    endTime: '16:00',
    location: 'UIT',
    room: 'Phòng C101',
    capacity: 80,
    registered: 77,
    status: 'ended',
    banner: null,
    speaker: 'Chuyên gia Lê Thị Bảo',
  },
];

export const MOCK_PARTICIPANTS = [
  { id: 'p1', mssv: '21520001', name: 'Nguyễn Văn An', faculty: 'CNTT', registeredAt: '2026-09-20T08:00:00', status: 'attended', eventId: '1' },
  { id: 'p2', mssv: '21520002', name: 'Trần Thị Bích', faculty: 'ATTT', registeredAt: '2026-09-21T09:30:00', status: 'pending', eventId: '1' },
  { id: 'p3', mssv: '21520003', name: 'Lê Minh Châu', faculty: 'KHMT', registeredAt: '2026-09-22T10:00:00', status: 'cancelled', eventId: '1' },
  { id: 'p4', mssv: '21520004', name: 'Phạm Quốc Dũng', faculty: 'CNTT', registeredAt: '2026-09-23T11:00:00', status: 'attended', eventId: '2' },
];

export const MOCK_STAFF = [
  { id: 's1', name: 'Nguyễn Hữu Nam', email: 'nam.nh@campus.edu.vn', assignedEvent: 'Hội thảo Trí tuệ nhân tạo 2026', permission: 'Điểm danh', accountStatus: 'active', lastActive: '26/09/2026' },
  { id: 's2', name: 'Trần Thị Lan', email: 'lan.tt@campus.edu.vn', assignedEvent: 'Workshop Data Engineering', permission: 'Điểm danh + Xem báo cáo', accountStatus: 'active', lastActive: '25/09/2026' },
  { id: 's3', name: 'Lê Văn Hùng', email: 'hung.lv@campus.edu.vn', assignedEvent: 'Ngày hội Đổi mới sáng tạo', permission: 'Điểm danh', accountStatus: 'inactive', lastActive: 'Chưa đăng nhập' },
];

// Chart mock data cho Dashboard
export const CHART_BAR_DATA = [
  { event: 'AI 2026', registered: 132, checkin: 110 },
  { event: 'Data Eng', registered: 58, checkin: 45 },
  { event: 'Đổi mới', registered: 500, checkin: 432 },
  { event: 'Kỹ năng', registered: 77, checkin: 70 },
];

export const CHART_PIE_DATA = [
  { name: 'CNTT', value: 38 },
  { name: 'ATTT', value: 22 },
  { name: 'KHMT', value: 18 },
  { name: 'MMT', value: 12 },
  { name: 'Khác', value: 10 },
];

export const CHART_LINE_DATA = [
  { month: 'T8', registrations: 120 },
  { month: 'T9', registrations: 210 },
  { month: 'T10', registrations: 340 },
  { month: 'T11', registrations: 280 },
  { month: 'T12', registrations: 190 },
];

// Tính trạng thái hiển thị cho sự kiện
export function getEventStatusLabel(status) {
  const map = {
    open: 'Đang mở',
    nearly_full: 'Sắp hết chỗ',
    full: 'Hết chỗ',
    draft: 'Bản nháp',
    closed: 'Đã đóng',
    ended: 'Đã kết thúc',
  };
  return map[status] || status;
}

export function getEventStatusColors(status) {
  const map = {
    open: { bg: '#dcfce7', text: '#15803d' },
    nearly_full: { bg: '#fef9c3', text: '#a16207' },
    full: { bg: '#fee2e2', text: '#b91c1c' },
    draft: { bg: '#f1f5f9', text: '#64748b' },
    closed: { bg: '#e0e7ff', text: '#4338ca' },
    ended: { bg: '#f1f5f9', text: '#94a3b8' },
  };
  return map[status] || { bg: '#f1f5f9', text: '#64748b' };
}

export const TOPIC_LABELS = {
  academic: 'Học thuật',
  skill: 'Kỹ năng',
  culture: 'Văn nghệ',
  sport: 'Thể thao',
  community: 'Cộng đồng',
};

export const TOPIC_COLORS = {
  academic: '#4f46e5',
  skill: '#0891b2',
  culture: '#7c3aed',
  sport: '#059669',
  community: '#d97706',
};
