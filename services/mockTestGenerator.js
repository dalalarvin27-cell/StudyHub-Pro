const { generateQuizFromNotes } = require("./quizGenerator");

async function generateMockTestFromNotes(cleanText, config = {}) {
  const questions = await generateQuizFromNotes(cleanText, {
    questionsCount: config.questionsCount || 10,
    difficulty: config.difficulty || "Medium",
    sourceFile: config.title || config.sourceFile || "Uploaded Document"
  });

  return {
    title: config.title || "Scanned Notes Practice Mock Test",
    category: "Custom Tests",
    durationMinutes: config.durationMinutes || 10,
    totalMarks: config.totalMarks || (questions.length * 4),
    questions
  };
}

module.exports = { generateMockTestFromNotes };
