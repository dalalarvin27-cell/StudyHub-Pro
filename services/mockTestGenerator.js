const { generateQuizFromNotes } = require("./quizGenerator");

async function generateMockTestFromNotes(cleanText, config = {}) {
  const questions = await generateQuizFromNotes(cleanText, {
    questionsCount: config.questionsCount || 10,
    difficulty: config.difficulty || "Medium"
  });

  return {
    title: config.title || "Scanned Notes Practice Mock Test",
    category: "Custom Tests",
    durationMinutes: config.durationMinutes || 15,
    totalMarks: (config.questionsCount || 10) * 4,
    questions
  };
}

module.exports = { generateMockTestFromNotes };