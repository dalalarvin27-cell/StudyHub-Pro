const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const upload = require("../middleware/uploadMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");
const { aiRateLimiter } = require("../middleware/rateLimiter");

// Safe Case-Insensitive Models Require
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

// 1. Upload Scanned Note Images / PDF Files & Extract Text
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
    console.error("[QUIZ] Upload Route Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to process document." });
  }
});

// 2. Generate Custom Timed Mock Test (ALWAYS CREATES A BRAND NEW TEST RECORD)
router.post("/:id/generate-test", verifyToken, aiRateLimiter, async (req, res) => {
  try {
    const scanDoc = await ScanDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scanDoc) return res.status(404).json({ success: false, message: "Scanned document not found." });

    const sourceFile = scanDoc.title || "Uploaded Document";
    const difficulty = req.body.difficulty || "Medium";
    const durationMinutes = Number(req.body.durationMinutes) || 10;
    const questionsCount = Number(req.body.questionsCount) || 10;
    const totalMarks = questionsCount * 4;

    // Generate a BRAND NEW Test ID for every request (Zero caching/reuse)
    const newTestId = new mongoose.Types.ObjectId();

    console.log(`[QUIZ] New generation requested`);
    console.log(`[QUIZ] Source file: ${sourceFile}`);
    console.log(`[QUIZ] Difficulty: ${difficulty}`);
    console.log(`[QUIZ] Duration: ${durationMinutes}`);
    console.log(`[QUIZ] New test ID: ${newTestId}`);
    console.log(`[QUIZ] Extracted text length: ${scanDoc.cleanText.length}`);

    const config = {
      questionsCount,
      difficulty,
      durationMinutes,
      sourceFile,
      title: `Mock Test: ${sourceFile} (${difficulty})`
    };

    // Generate fresh questions strictly from notes
    const mockData = await generateMockTestFromNotes(scanDoc.cleanText, config);

    const newTest = new MockTest({
      _id: newTestId,
      title: mockData.title,
      category: "Custom Tests",
      subject: "Scanned Notes / PDF",
      description: `AI-Generated Test (${difficulty} Difficulty) derived strictly from ${sourceFile}.`,
      totalQuestions: mockData.questions.length,
      totalMarks: totalMarks,
      durationMinutes: durationMinutes,
      difficulty: difficulty,
      generatedFromScanId: scanDoc._id,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await newTest.save();

    for (const q of mockData.questions) {
      await new Question({
        testId: newTest._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: difficulty
      }).save();
    }

    console.log(`[QUIZ] Saved new quiz: ${newTest._id}`);

    res.json({
      success: true,
      message: "Fresh mock test generated",
      testId: newTest._id,
      test: newTest
    });
  } catch (err) {
    console.error("[QUIZ] Generate Test Error:", err.message);
    res.status(400).json({
      success: false,
      message: err.message || "Unable to generate a new quiz from this document. Please try again."
    });
  }
});

module.exports = router;