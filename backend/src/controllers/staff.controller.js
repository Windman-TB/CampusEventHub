const staffService = require('../services/staff.service.js');

// Map error codes → HTTP status
const ERROR_STATUS_MAP = {
  EVENT_NOT_FOUND: 404,
  FORBIDDEN: 403,
  STUDENT_NOT_FOUND: 404,
  STAFF_NOT_FOUND: 404,
  ALREADY_ASSIGNED: 409,
  ACCOUNT_LOCKED: 422,
};

/**
 * Helper: gửi error response từ service error code
 */
function sendServiceError(res, error) {
  const status = ERROR_STATUS_MAP[error.code] || 500;
  return res.status(status).json({
    success: false,
    error: error.code || 'SERVER_ERROR',
    message: error.message,
  });
}

// ==========================================
// GET /api/organizer/students/search?query=...
// ==========================================
/**
 * Tìm kiếm sinh viên theo MSSV hoặc họ tên
 * Trả về danh sách gợi ý tối đa 10 kết quả
 */
const searchStudents = async (req, res, next) => {
  try {
    const { query } = req.query;

    const results = await staffService.searchStudents(query || '');
    return res.status(200).json({
      success: true,
      data: results,
      message:
        results.length > 0
          ? `Tìm thấy ${results.length} sinh viên phù hợp`
          : 'Không tìm thấy sinh viên phù hợp',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/organizer/events/:id/staff
// ==========================================
/**
 * Lấy danh sách nhân viên soát vé sự kiện
 */
const listStaff = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID sự kiện không hợp lệ',
      });
    }

    const staff = await staffService.getStaffByEvent(eventId, req.user.id);
    return res.status(200).json({
      success: true,
      data: staff,
      message: `Sự kiện có ${staff.length} nhân viên soát vé`,
    });
  } catch (error) {
    if (error.code) return sendServiceError(res, error);
    next(error);
  }
};

// ==========================================
// POST /api/organizer/events/:id/staff
// Body: { ma_tai_khoan: number }
// ==========================================
/**
 * Phân công nhân viên soát vé cho sự kiện
 */
const addStaff = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID sự kiện không hợp lệ',
      });
    }

    const { ma_tai_khoan } = req.body;
    if (!ma_tai_khoan) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELD',
        message: 'Thiếu trường ma_tai_khoan trong body',
      });
    }

    const maTaiKhoan = parseInt(ma_tai_khoan, 10);
    if (isNaN(maTaiKhoan)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FIELD',
        message: 'ma_tai_khoan phải là số nguyên',
      });
    }

    const newStaff = await staffService.assignStaff(eventId, maTaiKhoan, req.user.id);
    return res.status(201).json({
      success: true,
      data: newStaff,
      message: `Đã cấp quyền soát vé cho "${newStaff.ho_ten}" thành công`,
    });
  } catch (error) {
    if (error.code) return sendServiceError(res, error);
    next(error);
  }
};

// ==========================================
// DELETE /api/organizer/events/:id/staff/:staffId
// ==========================================
/**
 * Thu hồi quyền soát vé của nhân viên
 */
const removeStaff = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const staffId = parseInt(req.params.staffId, 10);

    if (!eventId || isNaN(eventId) || !staffId || isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID sự kiện hoặc ID nhân viên không hợp lệ',
      });
    }

    const result = await staffService.revokeStaff(eventId, staffId, req.user.id);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Đã thu hồi quyền soát vé thành công',
    });
  } catch (error) {
    if (error.code) return sendServiceError(res, error);
    next(error);
  }
};

module.exports = {
  searchStudents,
  listStaff,
  addStaff,
  removeStaff,
};
