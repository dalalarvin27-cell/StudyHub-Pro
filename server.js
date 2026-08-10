require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const mockTestRoutes = require("./routes/mockTestRoutes");
const pyqRoutes = require("./routes/pyqRoutes");
const onePagerRoutes = require("./routes/onePagerRoutes");
const scanRoutes = require("./routes/scanRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Express Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static file hosting
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Route Bindings
app.use("/api/auth", authRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/pyq", pyqRoutes);
app.use("/api/one-pagers", onePagerRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/admin", adminRoutes);

// Global Error Handler
app.use(errorHandler);

// Database Connection with MongoDB Atlas / Fallback
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduvault";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("==========================================");
    console.log("🚀 EduVault MongoDB Connected Successfully!");
    console.log("==========================================");
  })
  .catch((err) => {
    console.warn("MongoDB Connection Error:", err.message);
    console.warn("Running in in-memory / local fallback mode.");
  });

app.listen(PORT, () => {
  console.log(`✨ EduVault Platform Live on Port ${PORT}`);
});