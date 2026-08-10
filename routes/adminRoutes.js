const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("../middleware/authMiddleware");

const User = require("../models/User");
const Note = require("../models/Note");
const MockTest = require("../models/MockTest");
const Question = require("../models/Question");
const PYQ = require("../models/PYQ");
const TestAttempt = require("../models/TestAttempt");

// Admin Overview Analytics
router.get("/analytics", verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "student" });
    const totalNotes = await Note.countDocuments();
    const totalMockTests = await MockTest.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalPYQs = await PYQ.countDocuments();
    const totalAttempts = await TestAttempt.countDocuments();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalNotes,
        totalMockTests,
        totalQuestions,
        totalPYQs,
        totalAttempts,
        mostPopularTest: "NDA Mathematics Full Mock",
        mostAttemptedSubject: "Physics & Mathematics"
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Create Mock Test
router.post("/mock-test", verifyAdmin, async (req, res) => {
  try {
    const { title, category, subject, description, durationMinutes, totalMarks, questions } = req.body;
    
    const test = new MockTest({
      title,
      category,
      subject,
      description,
      durationMinutes,
      totalMarks,
      totalQuestions: questions ? questions.length : 10,
      createdBy: req.user.id
    });
    await test.save();

    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        await new Question({ ...q, testId: test._id }).save();
      }
    }

    res.json({ success: true, message: "Mock test created successfully", testId: test._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Create PYQ
router.post("/pyq", verifyAdmin, async (req, res) => {
  try {
    const pyq = new PYQ(req.body);
    await pyq.save();
    res.json({ success: true, message: "PYQ added successfully", pyq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;