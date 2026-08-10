const mongoose = require("mongoose");

const scanDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Scanned Notes Document" },
  imageUrls: [{ type: String }],
  extractedText: { type: String, default: "" },
  cleanText: { type: String, default: "" },
  status: { type: String, enum: ["uploaded", "processing", "completed", "failed"], default: "uploaded" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ScanDocument || mongoose.model("ScanDocument", scanDocumentSchema);
