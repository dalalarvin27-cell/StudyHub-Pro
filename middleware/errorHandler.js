const errorHandler = (err, req, res, next) => {
  console.error("EduVault Application Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

module.exports = errorHandler;