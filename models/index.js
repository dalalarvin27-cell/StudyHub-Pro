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

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  studentName: { type: String, default: "EduVault Admin" },
  status: { type: String, enum: ["pending", "approved"], default: "approved" },
  downloadsCount: { type: Number, default: 0 },
  rating: { type: Number, default: 4.9 },
  createdAt: { type: Date, default: Date.now }
});

const questionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest" },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: "" },
  subject: { type: String, default: "General" },
  topic: { type: String, default: "General" },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  questionType: { type: String, enum: ["MCQ", "MultipleCorrect", "TrueFalse", "AssertionReason"], default: "MCQ" }
});

const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String, default: "Full Test" },
  description: { type: String },
  totalQuestions: { type: Number, required: true, default: 10 },
  totalMarks: { type: Number, required: true, default: 100 },
  durationMinutes: { type: Number, required: true, default: 30 },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard", "Mixed"], default: "Medium" },
  negativeMarking: { type: Number, default: 0.33 },
  instructions: [{ type: String }],
  isPractice: { type: Boolean, default: true },
  generatedFromScanId: { type: mongoose.Schema.Types.ObjectId, ref: "ScanDocument" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

const testAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true },
  testTitle: { type: String, required: true },
  category: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  incorrectCount: { type: Number, required: true },
  unansweredCount: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeTakenSeconds: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    userAnswer: Number,
    correctAnswer: Number,
    isCorrect: Boolean,
    timeSpentSeconds: Number
  }],
  subjectPerformance: mongoose.Schema.Types.Mixed,
  difficultyPerformance: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const pyqSchema = new mongoose.Schema({
  exam: { type: String, required: true },
  year: { type: Number, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: "" },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  source: { type: String, default: "Public Domain Official Papers" },
  reportedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const onePagerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  summaryText: { type: String },
  keyPoints: [{ type: String }],
  formulas: [{ name: String, formula: String }],
  mnemonics: [{ title: String, trick: String }],
  examTips: [{ type: String }],
  tables: [{ headers: [String], rows: [[String]] }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

const scanDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Scanned Notes Document" },
  imageUrls: [{ type: String }],
  extractedText: { type: String, default: "" },
  cleanText: { type: String, default: "" },
  status: { type: String, enum: ["uploaded", "processing", "completed", "failed"], default: "uploaded" },
  createdAt: { type: Date, default: Date.now }
});

const generatedQuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: "ScanDocument" },
  title: { type: String, required: true },
  type: { type: String, enum: ["Quiz", "MockTest", "OnePager", "Flashcards", "ImportantQuestions"], default: "Quiz" },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    questionType: String
  }],
  onePagerData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contentType: { type: String, enum: ["PYQ", "Note", "OnePager", "Question"], required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String },
  subject: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const models = {
  User: mongoose.models.User || mongoose.model("User", userSchema),
  Note: mongoose.models.Note || mongoose.model("Note", noteSchema),
  Question: mongoose.models.Question || mongoose.model("Question", questionSchema),
  MockTest: mongoose.models.MockTest || mongoose.model("MockTest", mockTestSchema),
  TestAttempt: mongoose.models.TestAttempt || mongoose.model("TestAttempt", testAttemptSchema),
  PYQ: mongoose.models.PYQ || mongoose.model("PYQ", pyqSchema),
  OnePager: mongoose.models.OnePager || mongoose.model("OnePager", onePagerSchema),
  ScanDocument: mongoose.models.ScanDocument || mongoose.model("ScanDocument", scanDocumentSchema),
  GeneratedQuiz: mongoose.models.GeneratedQuiz || mongoose.model("GeneratedQuiz", generatedQuizSchema),
  Bookmark: mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema)
};

module.exports = models;
