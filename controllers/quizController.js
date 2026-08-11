const mongoose = require('mongoose');
const MockTest = require('../models/MockTest');
const { extractTextFromFile, generateAiQuestions } = require('../services/aiService');

/**
 * GENERATE NEW MOCK TEST (100% Fail-Safe)
 */
exports.generateQuiz = async (req, res) => {
  console.log(`[QUIZ] New generation requested`);

  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { difficulty = 'medium', duration, documentId } = req.body;
    const file = req.file;

    // Parse Custom Duration (1 to 600 mins)
    let parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      parsedDuration = 10;
    } else if (parsedDuration > 600) {
      parsedDuration = 600;
    }

    const sourceFileName = file ? file.originalname : (req.body.sourceFile || 'Uploaded-Document.pdf');

    console.log(`[QUIZ] Source file: ${sourceFileName}`);
    console.log(`[QUIZ] Difficulty: ${difficulty}`);
    console.log(`[QUIZ] Duration: ${parsedDuration} minutes`);

    // Safely Extract Text
    let textContent = '';
    try {
      textContent = await extractTextFromFile(file);
    } catch (e) {
      console.warn(`[QUIZ] Text extraction notice: ${e.message}`);
    }

    if (!textContent && req.body.extractedText) {
      textContent = req.body.extractedText;
    }

    console.log(`[QUIZ] Extracted text length: ${textContent ? textContent.length : 0}`);

    // Generate Fresh Questions (Never returns empty array)
    console.log(`[QUIZ] Generating fresh questions`);
    const cleanQuestions = await generateAiQuestions(textContent, difficulty, 10, sourceFileName);

    console.log(`[QUIZ] Generated question count: ${cleanQuestions.length}`);

    // Create Unique Test ID
    const newTestId = new mongoose.Types.ObjectId();
    console.log(`[QUIZ] New test ID: ${newTestId}`);

    const quizDataPayload = {
      testId: newTestId,
      _id: newTestId,
      userId,
      documentId: documentId || newTestId.toString(),
      sourceFile: sourceFileName,
      difficulty: difficulty.toLowerCase(),
      duration: parsedDuration,
      questions: cleanQuestions,
      createdAt: new Date()
    };

    // Try saving to MongoDB, but DO NOT FAIL the request if DB is offline
    try {
      const newMockTest = new MockTest(quizDataPayload);
      await newMockTest.save();
      console.log(`[QUIZ] Saved to MongoDB successfully: ${newMockTest._id}`);
    } catch (dbError) {
      console.warn(`[QUIZ DB WARNING] Database save skipped/failed: ${dbError.message}. Returning in-memory quiz session.`);
    }

    // Always Return 201 Success
    return res.status(201).json({
      success: true,
      data: quizDataPayload
    });

  } catch (error) {
    console.error(`[QUIZ ERROR] Generation pipeline error:`, error);
    
    // Return exact descriptive error message so debugging is transparent
    return res.status(500).json({
      success: false,
      message: `Quiz Generation Error: ${error.message || "Unexpected error occurred. Please try again."}`
    });
  }
};

/**
 * GET MOCK TEST BY ID
 */
exports.getMockTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    const test = await MockTest.findOne({
      $or: [
        ...(isValidObjectId ? [{ _id: id }] : []),
        ...(isValidObjectId ? [{ testId: id }] : []),
        { documentId: id }
      ]
    });

    if (!test) {
      console.log(`[QUIZ] Mock test not found in DB for query ID: ${id}`);
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

/**
 * SUBMIT MOCK TEST RESULT
 */
exports.submitMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { userAnswers } = req.body;

    const test = await MockTest.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }, { testId: id }] : []),
        { documentId: id }
      ]
    });

    let score = 0;
    const questions = test ? test.questions : [];
    const total = questions.length;

    questions.forEach((q, idx) => {
      const qKey = q.questionId || idx;
      const ans = userAnswers ? userAnswers[qKey] : undefined;
      if (ans !== undefined && String(ans) === String(q.correctAnswer)) {
        score++;
      }
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        score,
        total,
        percentage,
        submittedAt: new Date()
      }
    });
  } catch (error) {
    console.error(`[QUIZ ERROR] Submission error:`, error);
    return res.status(500).json({ success: false, message: "Error submitting test result." });
  }
};