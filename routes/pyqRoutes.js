const express = require("express");
const router = express.Router();
const PYQ = require("../models/PYQ");
const Bookmark = require("../models/Bookmark");
const { verifyToken } = require("../middleware/authMiddleware");

// Filter PYQs
router.get("/", async (req, res) => {
  try {
    const { exam, year, subject, topic, difficulty } = req.query;
    let query = {};
    if (exam) query.exam = exam;
    if (year) query.year = Number(year);
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    const pyqs = await PYQ.find(query).sort({ year: -1 });
    res.json({ success: true, count: pyqs.length, pyqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Report incorrect PYQ
router.post("/:id/report", async (req, res) => {
  try {
    const pyq = await PYQ.findByIdAndUpdate(req.params.id, { $inc: { reportedCount: 1 } }, { new: true });
    res.json({ success: true, message: "Question reported to EduVault moderation team." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
