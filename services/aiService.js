// services/aiService.js

/**
 * Difficulty-specific system instructions
 */
function buildDifficultyPrompt(difficulty) {
  const level = (difficulty || 'medium').toLowerCase();
  
  if (level === 'easy') {
    return `
DIFFICULTY LEVEL: EASY
- Focus on basic definitions, direct factual recall, and simple fundamental concepts.
- Options must be straightforward and clearly distinguishable.
`;
  } else if (level === 'hard') {
    return `
DIFFICULTY LEVEL: HARD
- Focus on deep conceptual understanding, multi-step logical reasoning, practical application, and tricky edge cases.
- Options must include closely related plausible distractors that require careful analysis.
`;
  }
  
  // Default Medium
  return `
DIFFICULTY LEVEL: MEDIUM
- Focus on conceptual comprehension, moderate problem-solving, and application of concepts.
- Options should test sound understanding of the subject matter.
`;
}

/**
 * Filter out duplicate questions
 */
function deduplicateQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  
  const seenTexts = new Set();
  const uniqueQuestions = [];

  for (const q of questions) {
    if (!q || !q.questionText) continue;
    const normalized = q.questionText.trim().toLowerCase();
    
    if (!seenTexts.has(normalized)) {
      seenTexts.add(normalized);
      uniqueQuestions.push(q);
    }
  }
  return uniqueQuestions;
}

module.exports = {
  buildDifficultyPrompt,
  deduplicateQuestions
};