const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true },
  testTitle: { type: String, required: true },
  category: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  incorrectCount: { type: Number, required: true },
  unansweredCount: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeTakenSeconds: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    userAnswer: Number,
    correctAnswer: Number,
    isCorrect: Boolean,
    timeSpentSeconds: Number
  }],
  subjectPerformance: mongoose.Schema.Types.Mixed,
  difficultyPerformance: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.TestAttempt || mongoose.model("TestAttempt", testAttemptSchema);
