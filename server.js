require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const { seedDatabaseIfEmpty } = require("./services/dbSeeder");

const app = express();
app.set("trust proxy", 1); // Trust reverse proxy headers on Render/Cloud hosts

const PORT = process.env.PORT || 3000;

// Express Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static Asset Hosting
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route Modules Import with Safe Fallbacks
let authRoutes, mockTestRoutes, pyqRoutes, onePagerRoutes, scanRoutes, attemptRoutes, bookmarkRoutes, adminRoutes, noteRoutes, feedbackRoutes;

try { authRoutes = require("./routes/authRoutes"); } catch(e) { console.warn("authRoutes:", e.message); }
try { mockTestRoutes = require("./routes/mockTestRoutes"); } catch(e) { console.warn("mockTestRoutes:", e.message); }
try { pyqRoutes = require("./routes/pyqRoutes"); } catch(e) { console.warn("pyqRoutes:", e.message); }
try { onePagerRoutes = require("./routes/onePagerRoutes"); } catch(e) { console.warn("onePagerRoutes:", e.message); }
try { scanRoutes = require("./routes/scanRoutes"); } catch(e) { console.warn("scanRoutes:", e.message); }
try { attemptRoutes = require("./routes/attemptRoutes"); } catch(e) { console.warn("attemptRoutes:", e.message); }
try { bookmarkRoutes = require("./routes/bookmarkRoutes"); } catch(e) { console.warn("bookmarkRoutes:", e.message); }
try { adminRoutes = require("./routes/adminRoutes"); } catch(e) { console.warn("adminRoutes:", e.message); }
try { noteRoutes = require("./routes/noteRoutes"); } catch(e) { console.warn("noteRoutes:", e.message); }
try { feedbackRoutes = require("./routes/feedbackRoutes"); } catch(e) { console.warn("feedbackRoutes:", e.message); }

// Mount API Routes
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

// Catch-all SPA / Fallback Route to serve index.html
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Global Error Handler
app.use(errorHandler);

// Database Connection with Auto-Seeder
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
