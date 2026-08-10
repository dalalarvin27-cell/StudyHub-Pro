const mongoose = require("mongoose");
const pyqSchema = new mongoose.Schema({
  exam: { type: String, required: true },
  year: { type: Number, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: "" },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  source: { type: String, default: "Public Domain Official Papers" },
  reportedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.models.PYQ || mongoose.model("PYQ", pyqSchema);
