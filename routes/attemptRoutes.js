const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

// Safe Case-Insensitive Model Imports for Render Linux
let TestAttempt, MockTest, Question;
try { TestAttempt = require("../models/TestAttempt"); } catch(e) { try { TestAttempt = require("../models/testattempt"); } catch(err) { TestAttempt = require("../models/TestAttempt.js"); } }
try { MockTest = require("../models/MockTest"); } catch(e) { try { MockTest = require("../models/mocktest"); } catch(err) { MockTest = require("../models/MockTest.js"); } }
try { Question = require("../models/Question"); } catch(e) { try { Question = require("../models/question"); } catch(err) { Question = require("../models/Question.js"); } }

// Submit test attempt & calculate analytics
router.post("/:testId/submit", verifyToken, async (req, res) => {
  try {
    const { answers, timeTakenSeconds } = req.body;
    const test = await MockTest.findById(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: "Mock test not found." });

    const dbQuestions = await Question.find({ testId: test._id });

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let score = 0;

    const evaluatedAnswers = dbQuestions.map(q => {
      const userAns = answers ? answers.find(a => a.questionId === q._id.toString()) : null;
      const userVal = userAns ? userAns.userAnswer : null;
      const timeSpent = userAns ? userAns.timeSpentSeconds || 0 : 0;

      let isCorrect = false;
      if (userVal === null || userVal === undefined) {
        unansweredCount++;
      } else if (userVal === q.correctAnswer) {
        correctCount++;
        score += (test.totalMarks / dbQuestions.length);
        isCorrect = true;
      } else {
        incorrectCount++;
        score -= ((test.totalMarks / dbQuestions.length) * test.negativeMarking);
      }

      return {
        questionId: q._id,
        userAnswer: userVal,
        correctAnswer: q.correctAnswer,
        isCorrect,
        timeSpentSeconds: timeSpent
      };
    });

    const totalAttempted = correctCount + incorrectCount;
    const percentage = Math.max(0, Math.round((score / test.totalMarks) * 100));
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    const attempt = new TestAttempt({
      userId: req.user.id,
      testId: test._id,
      testTitle: test.title,
      category: test.category,
      score: Math.max(0, Math.round(score)),
      totalMarks: test.totalMarks,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy,
      timeTakenSeconds,
      answers: evaluatedAnswers
    });

    await attempt.save();

    res.json({
      success: true,
      attemptId: attempt._id,
      results: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        accuracy: attempt.accuracy,
        timeTakenSeconds: attempt.timeTakenSeconds
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user attempt analytics
router.get("/user", verifyToken, async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get detailed attempt review
router.get("/:attemptId/review", verifyToken, async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({ _id: req.params.attemptId, userId: req.user.id });
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt record not found." });

    const questions = await Question.find({ testId: attempt.testId });

    const reviewData = attempt.answers.map(ans => {
      const q = questions.find(item => item._id.toString() === ans.questionId.toString());
      return {
        questionText: q ? q.questionText : "Question Text",
        options: q ? q.options : [],
        correctAnswer: ans.correctAnswer,
        userAnswer: ans.userAnswer,
        isCorrect: ans.isCorrect,
        explanation: q ? q.explanation : "",
        timeSpentSeconds: ans.timeSpentSeconds
      };
    });

    res.json({ success: true, attempt, reviewData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
