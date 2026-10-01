function successResponse(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, statusCode, message, code = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: code ? { code } : null,
  });
}

module.exports = {
  successResponse,
  errorResponse,
};