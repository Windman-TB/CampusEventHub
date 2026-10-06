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
