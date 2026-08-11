// services/aiService.js

/**
 * Build prompt matrix based on selected difficulty
 */
function buildDifficultyPrompt(difficulty) {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return `
DIFFICULTY LEVEL: EASY
- Focus on basic definitions, direct concepts, simple recall, and standard terminology.
- Options should have clear, distinct choices with minimal ambiguity.
`;
    case 'medium':
      return `
DIFFICULTY LEVEL: MEDIUM
- Focus on conceptual understanding, practical application, and cause-and-effect reasoning.
- Include scenarios that test moderate comprehension of the source material.
`;
    case 'hard':
      return `
DIFFICULTY LEVEL: HARD
- Focus on deep conceptual analysis, multi-step logical reasoning, complex application, and tricky edge cases.
- Include closely related choices that require careful distinction and deep understanding.
`;
    default:
      return `DIFFICULTY LEVEL: MEDIUM`;
  }
}

/**
 * Deduplicate questions in the generated array
 */
function deduplicateQuestions(questions) {
  const seenTexts = new Set();
  const unique = [];

  for (const q of questions) {
    const normalizedText = q.questionText.trim().toLowerCase();
    if (!seenTexts.has(normalizedText)) {
      seenTexts.add(normalizedText);
      unique.push(q);
    }
  }
  return unique;
}

module.exports = {
  buildDifficultyPrompt,
  deduplicateQuestions
};