const rateLimit = require("express-rate-limit");

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: { success: false, message: "Too many AI generation requests. Please try again in 15 minutes." }
});

module.exports = { aiRateLimiter };