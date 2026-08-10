const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Get all approved notes
router.get("/", async (req, res) => {
  try {
    const { category, subject, search } = req.query;
    let query = { status: "approved" };

    if (category) query.category = { $regex: category, $options: "i" };
    if (subject) query.subject = { $regex: subject, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Student Share Note (Saved as 'pending' for admin review)
router.post("/share", async (req, res) => {
  try {
    const { title, category, subject, description, fileUrl, studentName } = req.body;
    
    const note = new Note({
      title,
      category,
      subject: subject || category,
      description,
      fileUrl,
      studentName: studentName || "Student Contributor",
      status: "pending"
    });

    await note.save();
    res.json({ success: true, message: "Notes submitted for Admin verification!", note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Increment Note Download Count
router.post("/:id/download", async (req, res) => {
  try {
    await Note.findByIdAndUpdate(req.params.id, { $inc: { downloadsCount: 1 } });
    res.json({ success: true, message: "Download logged." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;