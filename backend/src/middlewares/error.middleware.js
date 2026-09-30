function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "API endpoint không tồn tại",
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};