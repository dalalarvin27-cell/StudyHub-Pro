const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest" },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // 0-indexed option
  explanation: { type: String, default: "" },
  subject: { type: String, default: "General" },
  topic: { type: String, default: "General" },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  questionType: { type: String, enum: ["MCQ", "MultipleCorrect", "TrueFalse", "AssertionReason"], default: "MCQ" }
});

module.exports = mongoose.model("Question", questionSchema);