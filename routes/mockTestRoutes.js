const express = require("express");
const router = express.Router();
const MockTest = require("../models/MockTest");
const Question = require("../models/Question");
const { verifyToken } = require("../middleware/authMiddleware");

// Get all mock tests
router.get("/", async (req, res) => {
  try {
    const { category, subject, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (search) query.title = { $regex: search, $options: "i" };

    const tests = await MockTest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: tests.length, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single mock test by ID
router.get("/:id", async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Mock test not found." });
    
    const questionsCount = await Question.countDocuments({ testId: test._id });
    res.json({ success: true, test, questionsCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start test (returns questions without exposing correct answers during test)
router.get("/:id/start", verifyToken, async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Mock test not found." });

    const questions = await Question.find({ testId: test._id }).select("-correctAnswer -explanation");
    
    res.json({
      success: true,
      test: {
        id: test._id,
        title: test.title,
        category: test.category,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        negativeMarking: test.negativeMarking,
        instructions: test.instructions
      },
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;