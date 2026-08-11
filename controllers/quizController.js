// controllers/quizController.js
const mongoose = require('mongoose');
const MockTest = require('../models/MockTest');
const { extractTextFromDocument } = require('../services/ocrService');
const { buildDifficultyPrompt, deduplicateQuestions } = require('../services/aiService');

// GENERATE QUIZ
exports.generateQuiz = async (req, res) => {
  console.log(`[QUIZ] New generation requested`);

  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { difficulty = 'medium', duration = 10, documentId } = req.body;
    const file = req.file;

    // Validate Duration (5, 10, 15)
    const parsedDuration = parseInt(duration, 10);
    const validDurations = [5, 10, 15];
    const finalDuration = validDurations.includes(parsedDuration) ? parsedDuration : 10;

    const sourceFileName = file ? file.originalname : (req.body.sourceFile || 'Uploaded Document');

    console.log(`[QUIZ] Source file: ${sourceFileName}`);
    console.log(`[QUIZ] Difficulty: ${difficulty}`);
    console.log(`[QUIZ] Duration: ${finalDuration}`);

    // Extract Text Fresh
    let textContent = '';
    if (file) {
      textContent = await extractTextFromDocument(file);
    } else if (req.body.extractedText) {
      textContent = req.body.extractedText;
    }

    if (!textContent || textContent.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Unable to extract readable text from document. Please upload a clearer PDF or photo."
      });
    }

    console.log(`[QUIZ] Extracted text length: ${textContent.length}`);

    // Generate Fresh Questions via AI Prompt
    console.log(`[QUIZ] Generating fresh questions`);
    const difficultyInstruction = buildDifficultyPrompt(difficulty);
    
    // Call AI Generation (Replace with your actual AI call service if different)
    const rawQuestions = await generateAiQuestionsWithPrompt(textContent, difficultyInstruction);

    // Deduplicate
    const cleanQuestions = deduplicateQuestions(rawQuestions);

    if (!cleanQuestions || cleanQuestions.length === 0) {
      // DO NOT silently return previous quiz
      return res.status(500).json({
        success: false,
        message: "Unable to generate a new quiz from this document. Please try again."
      });
    }

    console.log(`[QUIZ] Generated question count: ${cleanQuestions.length}`);

    // Create NEW Test Record
    const newTestId = new mongoose.Types.ObjectId();
    console.log(`[QUIZ] New test ID: ${newTestId}`);

    const newMockTest = new MockTest({
      testId: newTestId,
      userId,
      documentId: documentId || newTestId.toString(),
      sourceFile: sourceFileName,
      difficulty: difficulty.toLowerCase(),
      duration: finalDuration,
      questions: cleanQuestions,
      createdAt: new Date()
    });

    await newMockTest.save();
    console.log(`[QUIZ] Saved new quiz: ${newMockTest._id}`);

    return res.status(201).json({
      success: true,
      data: {
        testId: newMockTest.testId,
        _id: newMockTest._id,
        sourceFile: newMockTest.sourceFile,
        difficulty: newMockTest.difficulty,
        duration: newMockTest.duration,
        questions: newMockTest.questions,
        createdAt: newMockTest.createdAt
      }
    });

  } catch (error) {
    console.error(`[QUIZ ERROR] Generation failed:`, error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate a new quiz from this document. Please try again."
    });
  }
};

// GET QUIZ BY ID (FIXES "Mock test not found" ERROR)
exports.getMockTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    // Search by default _id OR custom testId
    const test = await MockTest.findOne({
      $or: [
        ...(isValidObjectId ? [{ _id: id }] : []),
        ...(isValidObjectId ? [{ testId: id }] : []),
        { documentId: id }
      ]
    });

    if (!test) {
      console.log(`[QUIZ] Mock test not found for query ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Mock test not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error(`[QUIZ ERROR] Fetch failed:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching mock test."
    });
  }
};

// Dummy helper wrapper for AI generation (connects to your OpenAI/Gemini call)
async function generateAiQuestionsWithPrompt(text, prompt) {
  // Your existing AI logic call goes here
  return [
    {
      questionId: new mongoose.Types.ObjectId().toString(),
      questionText: "Sample Question based on document text",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "0",
      explanation: "Direct concept explanation"
    }
  ];
}