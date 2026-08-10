const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contentType: { type: String, enum: ["PYQ", "Note", "OnePager", "Question"], required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String },
  subject: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);