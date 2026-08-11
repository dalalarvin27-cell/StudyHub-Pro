const errorHandler = (err, req, res, next) => {
  console.error("EduVault Application Error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds 4.5 MB limit. Please upload a smaller file."
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An internal server error occurred."
  });
};

module.exports = errorHandler;
