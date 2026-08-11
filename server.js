require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const { seedDatabaseIfEmpty } = require("./services/dbSeeder");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

let authRoutes, mockTestRoutes, pyqRoutes, onePagerRoutes, scanRoutes, attemptRoutes, bookmarkRoutes, adminRoutes, noteRoutes, feedbackRoutes;

try { authRoutes = require("./routes/authRoutes"); } catch(e) { console.warn("authRoutes load skipped:", e.message); }
try { mockTestRoutes = require("./routes/mockTestRoutes"); } catch(e) { console.warn("mockTestRoutes load skipped:", e.message); }
try { pyqRoutes = require("./routes/pyqRoutes"); } catch(e) { console.warn("pyqRoutes load skipped:", e.message); }
try { onePagerRoutes = require("./routes/onePagerRoutes"); } catch(e) { console.warn("onePagerRoutes load skipped:", e.message); }
try { scanRoutes = require("./routes/scanRoutes"); } catch(e) { console.warn("scanRoutes load skipped:", e.message); }
try { attemptRoutes = require("./routes/attemptRoutes"); } catch(e) { console.warn("attemptRoutes load skipped:", e.message); }
try { bookmarkRoutes = require("./routes/bookmarkRoutes"); } catch(e) { console.warn("bookmarkRoutes load skipped:", e.message); }
try { adminRoutes = require("./routes/adminRoutes"); } catch(e) { console.warn("adminRoutes load skipped:", e.message); }
try { noteRoutes = require("./routes/noteRoutes"); } catch(e) { console.warn("noteRoutes load skipped:", e.message); }
try { feedbackRoutes = require("./routes/feedbackRoutes"); } catch(e) { console.warn("feedbackRoutes load skipped:", e.message); }

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
