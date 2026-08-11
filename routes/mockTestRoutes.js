const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken } = require("../middleware/authMiddleware");

// Central Safe Models Require
let MockTest, Question;
try {
  const models = require("../models");
  MockTest = models.MockTest;
  Question = models.Question;
} catch (e) {
  MockTest = mongoose.models.MockTest || require("../models/MockTest");
  Question = mongoose.models.Question || require("../models/Question");
}

// 1. Get all mock tests
router.get("/", async (req, res) => {
  try {
    const { category, subject, search } = req.query;
    let query = {};
    if (category && category !== "ALL") query.category = category;
    if (subject && subject !== "ALL") query.subject = subject;
    if (search) query.title = { $regex: search, $options: "i" };

    const tests = await MockTest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: tests.length, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Get single mock test by ID
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

// 3. Start Test Endpoint
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
        durationMinutes: test.durationMinutes || 10,
        totalMarks: test.totalMarks,
        negativeMarking: test.negativeMarking || 0.33,
        instructions: test.instructions || ["Read each question carefully.", "Timer starts automatically."]
      },
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
