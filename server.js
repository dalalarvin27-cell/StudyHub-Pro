require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const { seedDatabaseIfEmpty } = require("./services/dbSeeder");

const app = express();
app.set("trust proxy", 1); // Fix for Render / Reverse proxy warning

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static Asset Hosting
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route Modules
let authRoutes, mockTestRoutes, pyqRoutes, onePagerRoutes, scanRoutes, attemptRoutes, bookmarkRoutes, adminRoutes, noteRoutes, feedbackRoutes;

try { authRoutes = require("./routes/authRoutes"); } catch(e) {}
try { mockTestRoutes = require("./routes/mockTestRoutes"); } catch(e) {}
try { pyqRoutes = require("./routes/pyqRoutes"); } catch(e) {}
try { onePagerRoutes = require("./routes/onePagerRoutes"); } catch(e) {}
try { scanRoutes = require("./routes/scanRoutes"); } catch(e) {}
try { attemptRoutes = require("./routes/attemptRoutes"); } catch(e) {}
try { bookmarkRoutes = require("./routes/bookmarkRoutes"); } catch(e) {}
try { adminRoutes = require("./routes/adminRoutes"); } catch(e) {}
try { noteRoutes = require("./routes/noteRoutes"); } catch(e) {}
try { feedbackRoutes = require("./routes/feedbackRoutes"); } catch(e) {}

if (authRoutes) app.use("/api/auth", authRoutes);
if (mockTestRoutes) app.use("/api/mock-tests", mockTestRoutes);
if (pyqRoutes) app.use("/api/pyq", pyqRoutes);
if (onePagerRoutes) app.use("/api/one-pagers", onePagerRoutes);
if (scanRoutes) app.use("/api/scan", scanRoutes);
if (attemptRoutes) app.use("/api/attempts", attemptRoutes);
if (bookmarkRoutes) app.use("/api/bookmarks", bookmarkRoutes);
if (adminRoutes) app.use("/api/admin", adminRoutes);
if (noteRoutes) app.use("/api/notes", noteRoutes);
if (feedbackRoutes) app.use("/api/feedback", feedbackRoutes);

// HTML Fallback Routes (Fixes White Blank Page Error)
app.get("/scan", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "scan.html"));
});

app.get("/mock-tests", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "mock-tests.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Wildcard fallback for clean navigation
app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(errorHandler);

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduvault";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("==========================================");
    console.log("🚀 EduVault MongoDB Connected Successfully!");
    console.log("==========================================");
    if (typeof seedDatabaseIfEmpty === 'function') {
      seedDatabaseIfEmpty();
    }
  })
  .catch((err) => {
    console.warn("MongoDB Connection Warning:", err.message);
    console.warn("Running in local fallback mode.");
  });

app.listen(PORT, () => {
  console.log(`✨ EduVault Platform Live on Port ${PORT}`);
});