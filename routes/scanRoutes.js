const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");
const { aiRateLimiter } = require("../middleware/rateLimiter");

// Safe Central Model Imports (Prevents Render Linux MODULE_NOT_FOUND & OverwriteModelError)
let ScanDocument, GeneratedQuiz, MockTest, Question;
try {
  const models = require("../models");
  ScanDocument = models.ScanDocument || require("../models/ScanDocument");
  GeneratedQuiz = models.GeneratedQuiz || require("../models/GeneratedQuiz");
  MockTest = models.MockTest || require("../models/MockTest");
  Question = models.Question || require("../models/Question");
} catch (e) {
  try { ScanDocument = require("../models/ScanDocument"); } catch (err) { ScanDocument = require("../models/scandocument"); }
  try { GeneratedQuiz = require("../models/GeneratedQuiz"); } catch (err) { GeneratedQuiz = require("../models/generatedquiz"); }
  try { MockTest = require("../models/MockTest"); } catch (err) { MockTest = require("../models/mocktest"); }
  try { Question = require("../models/Question"); } catch (err) { Question = require("../models/question"); }
}

const { extractTextFromImage } = require("../services/ocrService");
const { generateQuizFromNotes } = require("../services/quizGenerator");
const { generateMockTestFromNotes } = require("../services/mockTestGenerator");
const { generateOnePagerFromNotes } = require("../services/notesGenerator");

// 1. Upload Scanned Note Images / PDF Files & Process OCR
router.post("/upload", verifyToken, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image or PDF files uploaded." });
    }

    const imageUrls = req.files.map(f => `/uploads/${f.filename}`);

    const scanDoc = new ScanDocument({
      userId: req.user.id,
      title: req.body.title || `Scan ${new Date().toLocaleDateString("en-IN")}`,
      imageUrls,
      status: "processing"
    });

    await scanDoc.save();

    // Extract text using OCR Service
    let combinedText = "";
    for (const file of req.files) {
      const text = await extractTextFromImage(file.path);
      combinedText += text + "\n";
    }

    scanDoc.extractedText = combinedText;
    scanDoc.cleanText = combinedText.trim();
    scanDoc.status = "completed";
    await scanDoc.save();

    res.json({ success: true, message: "OCR Scan Completed Successfully", scanDoc });
  } catch (err) {
    console.error("Scan Upload Route Error:", err);
    res.status(500).json({ success: false, message: err.message || "File upload or OCR failed." });
  }
});

// 2. Generate Custom Mock Test Series (With Difficulty, Question Count & Timer)
router.post("/:id/generate-test", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const questionsCount = Number(req.body.questionsCount) || 10;
    const difficulty = req.body.difficulty || "Medium";
    const durationMinutes = Number(req.body.durationMinutes) || 10;
    const totalMarks = Number(req.body.totalMarks) || (questionsCount * 4);

    const config = {
      questionsCount,
      difficulty,
      durationMinutes,
      totalMarks,
      title: `Mock Test: ${scanDoc.title} (${difficulty})`
    };

    const mockData = await generateMockTestFromNotes(scanDoc.cleanText, config);

    const test = new MockTest({
      title: mockData.title,
      category: "Custom Tests",
      subject: "Scanned Notes / PDF",
      description: `AI-Generated Test (${difficulty} Difficulty) derived from your uploaded notes.`,
      totalQuestions: questionsCount,
      totalMarks: totalMarks,
      durationMinutes: durationMinutes,
      difficulty: difficulty,
      generatedFromScanId: scanDoc._id,
      createdBy: req.user.id
    });
    await test.save();

    if (mockData.questions && Array.isArray(mockData.questions)) {
      for (const q of mockData.questions) {
        const newQ = new Question({
          testId: test._id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: difficulty
        });
        await newQ.save();
      }
    }

    res.json({ success: true, message: "Custom Mock Test Series generated successfully", testId: test._id });
  } catch (err) {
    console.error("Generate Test Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to generate mock test." });
  }
});

// 3. Generate Quick MCQ Quiz
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
    console.error("Generate Quiz Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to generate quiz." });
  }
});

// 4. Generate One-Pager Revision Sheet
router.post("/:id/generate-one-pager", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const onePagerData = await generateOnePagerFromNotes(scanDoc.cleanText, scanDoc.title);
    res.json({ success: true, onePager: onePagerData });
  } catch (err) {
    console.error("Generate One-Pager Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to generate one-pager." });
  }
});

// 5. Get User Scanned Documents History
router.get("/history", verifyToken, async (req, res) => {
  try {
    const scans = await ScanDocument.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: scans.length, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;