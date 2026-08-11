// controllers/quizController.js
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const { extractTextFromDocument } = require('../services/ocrService'); // Your existing OCR/PDF service
const { generateAiQuestions } = require('../services/aiService'); // Your AI API handler

exports.generateQuiz = async (req, res) => {
  const startTime = Date.now();
  console.log(`[QUIZ] New generation requested`);

  try {
    const userId = req.user._id || req.user.id;
    const { difficulty = 'medium', duration = 10, documentId } = req.body;
    const file = req.file;

    const parsedDuration = parseInt(duration, 10);
    const validDurations = [5, 10, 15];
    const finalDuration = validDurations.includes(parsedDuration) ? parsedDuration : 10;
    const sourceFileName = file ? file.originalname : (req.body.sourceFile || 'Uploaded Document');

    console.log(`[QUIZ] Source file: ${sourceFileName}`);
    console.log(`[QUIZ] Difficulty: ${difficulty}`);
    console.log(`[QUIZ] Duration: ${finalDuration} minutes`);

    // 1. Extract Text Fresh
    let extractedText = '';
    if (file) {
      extractedText = await extractTextFromDocument(file);
    } else if (req.body.extractedText) {
      extractedText = req.body.extractedText;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: "Unable to extract readable text from the document. Please upload a clearer PDF or image."
      });
    }

    console.log(`[QUIZ] Extracted text length: ${extractedText.length}`);

    // 2. Generate Fresh Questions via AI
    console.log(`[QUIZ] Generating fresh questions`);
    const rawQuestions = await generateAiQuestions({
      text: extractedText,
      difficulty,
      numQuestions: 10
    });

    if (!rawQuestions || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      // DO NOT RETURN AN OLD QUIZ ON FAILURE!
      return res.status(500).json({
        success: false,
        message: "Unable to generate a new quiz from this document. Please try again."
      });
    }

    console.log(`[QUIZ] Generated question count: ${rawQuestions.length}`);

    // 3. Create NEW Unique Test ID & Record
    const newTestId = new mongoose.Types.ObjectId();
    console.log(`[QUIZ] New test ID: ${newTestId}`);

    const newQuiz = new Quiz({
      testId: newTestId,
      userId,
      documentId: documentId || newTestId.toString(),
      sourceFile: sourceFileName,
      difficulty,
      duration: finalDuration,
      questions: rawQuestions,
      createdAt: new Date()
    });

    await newQuiz.save();
    console.log(`[QUIZ] Saved new quiz: ${newQuiz._id} (TestID: ${newTestId})`);

    return res.status(201).json({
      success: true,
      data: {
        testId: newQuiz.testId,
        quizId: newQuiz._id,
        sourceFile: newQuiz.sourceFile,
        difficulty: newQuiz.difficulty,
        duration: newQuiz.duration,
        questions: newQuiz.questions,
        createdAt: newQuiz.createdAt
      }
    });

  } catch (error) {
    console.error(`[QUIZ ERROR] Generation failed:`, error);
    // Explicit error message, NO cached quiz fallback
    return res.status(500).json({
      success: false,
      message: "Unable to generate a new quiz from this document. Please try again."
    });
  }
};