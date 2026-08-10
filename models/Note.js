const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  studentName: { type: String, default: "EduVault Admin" },
  status: { type: String, enum: ["pending", "approved"], default: "approved" },
  downloadsCount: { type: Number, default: 0 },
  rating: { type: Number, default: 4.9 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.models.Note || mongoose.model("Note", noteSchema);
