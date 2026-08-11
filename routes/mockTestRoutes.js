const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure Multer for both Disk & Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

const quizController = require('../controllers/quizController');

// Generate Mock Test Route
router.post('/generate', upload.single('file'), quizController.generateQuiz);

// Get Mock Test by ID Route
router.get('/:id', quizController.getMockTestById);

// Submit Mock Test Result Route
router.post('/:id/submit', quizController.submitMockTest);

module.exports = router;