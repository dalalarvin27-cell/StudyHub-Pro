const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/toggle", verifyToken, async (req, res) => {
  try {
    const { contentType, contentId, title, subject } = req.body;
    const existing = await Bookmark.findOne({ userId: req.user.id, contentId });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({ success: true, bookmarked: false, message: "Bookmark removed." });
    } else {
      const bookmark = new Bookmark({ userId: req.user.id, contentType, contentId, title, subject });
      await bookmark.save();
      return res.json({ success: true, bookmarked: true, message: "Added to bookmarks." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/user", verifyToken, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: bookmarks.length, bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;