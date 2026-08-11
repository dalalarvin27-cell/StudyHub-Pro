const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

const quizController = require('../controllers/quizController');

// Allow both /api/scan and /api/scan/generate to process file uploads safely
router.post('/', upload.single('file'), quizController.generateQuiz);
router.post('/generate', upload.single('file'), quizController.generateQuiz);

module.exports = router;