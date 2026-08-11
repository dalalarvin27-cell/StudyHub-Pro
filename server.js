require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const { seedDatabaseIfEmpty } = require("./services/dbSeeder");

const authRoutes = require("./routes/authRoutes");
const mockTestRoutes = require("./routes/mockTestRoutes");
const pyqRoutes = require("./routes/pyqRoutes");
const onePagerRoutes = require("./routes/onePagerRoutes");
const scanRoutes = require("./routes/scanRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const adminRoutes = require("./routes/adminRoutes");
const noteRoutes = require("./routes/noteRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/pyq", pyqRoutes);
app.use("/api/one-pagers", onePagerRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use(errorHandler);

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduvault";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("==========================================");
    console.log("🚀 EduVault MongoDB Connected Successfully!");
    console.log("==========================================");
    seedDatabaseIfEmpty();
  })
  .catch((err) => {
    console.warn("MongoDB Connection Warning:", err.message);
    console.warn("Running in local fallback mode.");
  });

app.listen(PORT, () => {
  console.log(`✨ EduVault Platform Live on Port ${PORT}`);
});
