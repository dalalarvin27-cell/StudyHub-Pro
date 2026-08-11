const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");
const { aiRateLimiter } = require("../middleware/rateLimiter");

let ScanDocument, GeneratedQuiz, MockTest, Question;
try {
  const models = require("../models");
  ScanDocument = models.ScanDocument || require("../models/ScanDocument");
  GeneratedQuiz = models.GeneratedQuiz || require("../models/GeneratedQuiz");
  MockTest = models.MockTest || require("../models/MockTest");
  Question = models.Question || require("../models/Question");
} catch (e) {
  ScanDocument = require("../models/ScanDocument");
  GeneratedQuiz = require("../models/GeneratedQuiz");
  MockTest = require("../models/MockTest");
  Question = require("../models/Question");
}

const { extractTextFromFile } = require("../services/ocrService");
const { generateQuizFromNotes } = require("../services/quizGenerator");
const { generateMockTestFromNotes } = require("../services/mockTestGenerator");
const { generateOnePagerFromNotes } = require("../services/notesGenerator");

// 1. Upload Document & Extract Text
router.post("/upload", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image or PDF files uploaded." });
    }

    const file = req.files[0];
    const extractResult = await extractTextFromFile(file.path, file.mimetype, file.originalname);

    if (!extractResult.success) {
      return res.status(400).json({
        success: false,
        message: extractResult.error
      });
    }

    const imageUrls = req.files.map(f => `/uploads/${f.filename}`);

    const scanDoc = new ScanDocument({
      userId: req.user.id,
      title: req.body.title || file.originalname || `Scan ${new Date().toLocaleDateString("en-IN")}`,
      imageUrls,
      extractedText: extractResult.cleanText,
      cleanText: extractResult.cleanText,
      status: "completed"
    });

    await scanDoc.save();

    res.json({
      success: true,
      message: "Text Extracted Successfully",
      scanDoc
    });
  } catch (err) {
    console.error("[QUIZ] Scan Upload Route Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to process document."
    });
  }
});

// 2. Generate Custom Timed Mock Test
router.post("/:id/generate-test", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const questionsCount = Number(req.body.questionsCount) || 10;
    const difficulty = req.body.difficulty || "Medium";
    const durationMinutes = Number(req.body.durationMinutes) || 15;

    const config = {
      questionsCount,
      difficulty,
      durationMinutes,
      title: `Mock Test: ${scanDoc.title}`
    };

    const mockData = await generateMockTestFromNotes(scanDoc.cleanText, config);

    const test = new MockTest({
      title: mockData.title,
      category: "Custom Tests",
      subject: "Scanned Notes / PDF",
      description: "AI-Generated Test derived strictly from your uploaded notes.",
      totalQuestions: mockData.questions.length,
      totalMarks: mockData.totalMarks,
      durationMinutes: durationMinutes,
      difficulty: difficulty,
      generatedFromScanId: scanDoc._id,
      createdBy: req.user.id
    });
    await test.save();

    for (const q of mockData.questions) {
      await new Question({
        testId: test._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: difficulty
      }).save();
    }

    res.json({ success: true, message: "Mock test generated from notes", testId: test._id });
  } catch (err) {
    console.error("[QUIZ] Generate Test Error:", err.message);
    res.status(400).json({ success: false, message: err.message || "Failed to generate mock test." });
  }
});

// 3. Generate MCQ Quiz
router.post("/:id/generate-quiz", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const questionsCount = Number(req.body.questionsCount) || 10;
    const questions = await generateQuizFromNotes(scanDoc.cleanText, { questionsCount });

    const generated = new GeneratedQuiz({
      userId: req.user.id,
      scanId: scanDoc._id,
      title: `Quiz from: ${scanDoc.title}`,
      type: "Quiz",
      questions
    });

    await generated.save();
    res.json({ success: true, quiz: generated });
  } catch (err) {
    console.error("[QUIZ] Generate Quiz Error:", err.message);
    res.status(400).json({ success: false, message: err.message || "Failed to generate quiz." });
  }
});

// 4. Generate One-Pager
router.post("/:id/generate-one-pager", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const onePagerData = await generateOnePagerFromNotes(scanDoc.cleanText, scanDoc.title);
    res.json({ success: true, onePager: onePagerData });
  } catch (err) {
    console.error("[QUIZ] Generate One-Pager Error:", err.message);
    res.status(400).json({ success: false, message: err.message || "Failed to generate one-pager." });
  }
});

// 5. Scan History
router.get("/history", verifyToken, async (req, res) => {
  try {
    const scans = await ScanDocument.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: scans.length, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;