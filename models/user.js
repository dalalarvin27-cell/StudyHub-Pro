const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  targetExam: { type: String, default: "NDA" },
  avatar: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
