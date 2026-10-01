const participantsService = require('../services/participants.service.js');
const exportService = require('../services/export.service.js');

/**
 * GET /api/organizer/events/:id/participants
 * Lấy danh sách người tham gia sự kiện
 * Query: ?status=DaDangKy|DaCheckIn|DaHuy&search=mssv_hoac_ten&page=1&limit=20
 */
const listParticipants = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID sự kiện không hợp lệ',
      });
    }

    const { status, search, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const result = await participantsService.getParticipants(eventId, {
      status: status || undefined,
      search: search || undefined,
      page: pageNum,
      limit: limitNum,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
      message: 'Lấy danh sách người tham gia thành công',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/organizer/tickets/:id/status
 * Đổi trạng thái vé thủ công (BTC can thiệp)
 * Body: { trang_thai_ve: 'DaDangKy' | 'DaCheckIn' | 'DaHuy' }
 */
const patchTicketStatus = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID vé không hợp lệ',
      });
    }

    const { trang_thai_ve } = req.body;
    if (!trang_thai_ve) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_STATUS',
        message: 'Thiếu trường trang_thai_ve trong body',
      });
    }

    const updated = await participantsService.changeTicketStatus(
      ticketId,
      trang_thai_ve,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: updated,
      message: `Đổi trạng thái vé thành "${trang_thai_ve}" thành công`,
    });
  } catch (error) {
    if (error.code === 'TICKET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    if (error.code === 'INVALID_STATUS') {
      return res.status(400).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/organizer/events/:id/export?format=csv|xlsx
 * Xuất danh sách người tham gia sự kiện ra file CSV hoặc Excel (XLSX)
 */
const exportParticipants = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID sự kiện không hợp lệ',
      });
    }

    const format = (req.query.format || 'csv').toLowerCase();
    if (format !== 'csv' && format !== 'xlsx') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FORMAT',
        message: 'Định dạng xuất file chỉ hỗ trợ "csv" hoặc "xlsx"',
      });
    }

    if (format === 'csv') {
      const { buffer, filename } = await exportService.exportParticipantsCSV(
        eventId,
        req.user.id
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    } else {
      const { buffer, filename } = await exportService.exportParticipantsXLSX(
        eventId,
        req.user.id
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    }
  } catch (error) {
    if (error.code === 'EVENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    next(error);
  }
};

module.exports = {
  listParticipants,
  patchTicketStatus,
  exportParticipants,
};
