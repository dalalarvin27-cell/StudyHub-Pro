const mongoose = require("mongoose");

const onePagerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true }, // Mathematics, Physics, Chemistry, English, History, Geography, Current Affairs, CS
  topic: { type: String, required: true },
  summaryText: { type: String },
  keyPoints: [{ type: String }],
  formulas: [{ name: String, formula: String }],
  mnemonics: [{ title: String, trick: String }],
  examTips: [{ type: String }],
  tables: [{ headers: [String], rows: [[String]] }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OnePager", onePagerSchema);