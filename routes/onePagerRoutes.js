const express = require("express");
const router = express.Router();
const OnePager = require("../models/OnePager");

router.get("/", async (req, res) => {
  try {
    const { subject, topic, search } = req.query;
    let query = {};
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (search) query.title = { $regex: search, $options: "i" };

    const onePagers = await OnePager.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: onePagers.length, onePagers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;