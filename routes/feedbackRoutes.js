const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, count: feedbacks.length, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, role, rating, message } = req.body;
    const feedback = new Feedback({ name, role, rating: Number(rating), message });
    await feedback.save();
    res.json({ success: true, message: "Feedback submitted successfully!", feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
