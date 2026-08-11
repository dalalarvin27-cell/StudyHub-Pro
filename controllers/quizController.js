const mongoose = require('mongoose');
const MockTest = require('../models/MockTest');
const { extractTextFromFile, generateAiQuestions } = require('../services/aiService');

/**
 * GENERATE NEW MOCK TEST
 * Creates a unique testId & DB record on every single request
 */
exports.generateQuiz = async (req, res) => {
  console.log(`[QUIZ] New generation requested`);

  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { difficulty = 'medium', duration, documentId } = req.body;
    const file = req.file;

    // Custom Duration Validation (allows any number from 1 to 600 mins)
    let parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      parsedDuration = 10; // Default 10 Mins if invalid
    } else if (parsedDuration > 600) {
      parsedDuration = 600; // Cap at 10 Hours
    }

    const sourceFileName = file ? file.originalname : (req.body.sourceFile || 'Uploaded Document.pdf');

    console.log(`[QUIZ] Source file: ${sourceFileName}`);
    console.log(`[QUIZ] Difficulty: ${difficulty}`);
    console.log(`[QUIZ] Custom Duration: ${parsedDuration} minutes`);

    // Extract Text safely
    let textContent = await extractTextFromFile(file);
    if (!textContent && req.body.extractedText) {
      textContent = req.body.extractedText;
    }

    console.log(`[QUIZ] Extracted text length: ${textContent.length}`);

    // Generate Fresh Questions
    console.log(`[QUIZ] Generating fresh questions`);
    const cleanQuestions = await generateAiQuestions(textContent, difficulty, 10, sourceFileName);

    if (!cleanQuestions || cleanQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Unable to generate a new quiz from this document. Please try again."
      });
    }

    console.log(`[QUIZ] Generated question count: ${cleanQuestions.length}`);

    // Create NEW Unique Test Record
    const newTestId = new mongoose.Types.ObjectId();
    console.log(`[QUIZ] New test ID: ${newTestId}`);

    const newMockTest = new MockTest({
      testId: newTestId,
      userId,
      documentId: documentId || newTestId.toString(),
      sourceFile: sourceFileName,
      difficulty: difficulty.toLowerCase(),
      duration: parsedDuration,
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

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found." });
    }

    let score = 0;
    const total = test.questions.length;

    test.questions.forEach((q, idx) => {
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