const mongoose = require("mongoose");
const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String, default: "Full Test" },
  description: { type: String },
  totalQuestions: { type: Number, required: true, default: 10 },
  totalMarks: { type: Number, required: true, default: 100 },
  durationMinutes: { type: Number, required: true, default: 30 },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard", "Mixed"], default: "Medium" },
  negativeMarking: { type: Number, default: 0.33 },
  instructions: [{ type: String }],
  isPractice: { type: Boolean, default: true },
  generatedFromScanId: { type: mongoose.Schema.Types.ObjectId, ref: "ScanDocument" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.models.MockTest || mongoose.model("MockTest", mockTestSchema);
