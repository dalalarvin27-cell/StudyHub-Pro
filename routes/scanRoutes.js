const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");
const { aiRateLimiter } = require("../middleware/rateLimiter");

// Safe Case-Insensitive Model Imports (Prevents Render Linux MODULE_NOT_FOUND)
let ScanDocument, GeneratedQuiz, MockTest, Question;
try { ScanDocument = require("../models/ScanDocument"); } catch(e) { try { ScanDocument = require("../models/scandocument"); } catch(err) { ScanDocument = require("../models/ScanDocument.js"); } }
try { GeneratedQuiz = require("../models/GeneratedQuiz"); } catch(e) { try { GeneratedQuiz = require("../models/generatedquiz"); } catch(err) { GeneratedQuiz = require("../models/GeneratedQuiz.js"); } }
try { MockTest = require("../models/MockTest"); } catch(e) { try { MockTest = require("../models/mocktest"); } catch(err) { MockTest = require("../models/MockTest.js"); } }
try { Question = require("../models/Question"); } catch(e) { try { Question = require("../models/question"); } catch(err) { Question = require("../models/Question.js"); } }

const { extractTextFromImage } = require("../services/ocrService");
const { generateQuizFromNotes } = require("../services/quizGenerator");
const { generateMockTestFromNotes } = require("../services/mockTestGenerator");
const { generateOnePagerFromNotes } = require("../services/notesGenerator");

// Upload scanned note page
router.post("/upload", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image files uploaded." });
    }

    const imageUrls = req.files.map(f => `/uploads/${f.filename}`);

    const scanDoc = new ScanDocument({
      userId: req.user.id,
      title: req.body.title || `Scan ${new Date().toLocaleDateString("en-IN")}`,
      imageUrls,
      status: "processing"
    });

    await scanDoc.save();

    let combinedText = "";
    for (const file of req.files) {
      const text = await extractTextFromImage(file.path);
      combinedText += text + "\n";
    }

    scanDoc.extractedText = combinedText;
    scanDoc.cleanText = combinedText.trim();
    scanDoc.status = "completed";
    await scanDoc.save();

    res.json({ success: true, message: "OCR Scan Completed", scanDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate Quiz
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
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate Mock Test
router.post("/:id/generate-test", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const config = {
      questionsCount: Number(req.body.questionsCount) || 10,
      difficulty: req.body.difficulty || "Medium",
      durationMinutes: Number(req.body.durationMinutes) || 15,
      title: `Mock Test: ${scanDoc.title}`
    };

    const mockData = await generateMockTestFromNotes(scanDoc.cleanText, config);

    const test = new MockTest({
      title: mockData.title,
      category: "Custom Tests",
      subject: "Scanned Notes",
      description: "AI-Generated Mock Test strictly derived from your uploaded notes.",
      totalQuestions: config.questionsCount,
      totalMarks: mockData.totalMarks,
      durationMinutes: config.durationMinutes,
      difficulty: config.difficulty,
      generatedFromScanId: scanDoc._id,
      createdBy: req.user.id
    });
    await test.save();

    for (const q of mockData.questions) {
      const newQ = new Question({
        testId: test._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: config.difficulty
      });
      await newQ.save();
    }

    res.json({ success: true, message: "Mock test generated from notes", testId: test._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate One-Pager
router.post("/:id/generate-one-pager", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const onePagerData = await generateOnePagerFromNotes(scanDoc.cleanText, scanDoc.title);
    res.json({ success: true, onePager: onePagerData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user scan history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const scans = await ScanDocument.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: scans.length, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
