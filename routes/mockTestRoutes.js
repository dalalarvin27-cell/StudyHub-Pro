const express = require('express');
const router = express.Router();
const multer = require('multer');

// Memory storage for fast buffer processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB Limit
});

const quizController = require('../controllers/quizController');

// Generate Mock Test
router.post('/generate', upload.single('file'), quizController.generateQuiz);

// Get Mock Test by ID
router.get('/:id', quizController.getMockTestById);

// Submit Mock Test Result
router.post('/:id/submit', quizController.submitMockTest);

module.exports = router;