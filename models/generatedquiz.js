const mongoose = require("mongoose");

const generatedQuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: "ScanDocument" },
  title: { type: String, required: true },
  type: { type: String, enum: ["Quiz", "MockTest", "OnePager", "Flashcards", "ImportantQuestions"], default: "Quiz" },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    questionType: String
  }],
  onePagerData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GeneratedQuiz", generatedQuizSchema);