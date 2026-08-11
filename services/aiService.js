const pdfParse = require('pdf-parse');

/**
 * Builds specific AI Prompt instructions based on chosen difficulty
 */
function buildDifficultyPrompt(difficulty) {
  const level = (difficulty || 'medium').toLowerCase();
  
  if (level === 'easy') {
    return `
DIFFICULTY LEVEL: EASY
- Focus on basic definitions, direct factual recall, and simple fundamental concepts.
- Options must be straightforward, obvious, and clearly distinguishable.
- Questions should test baseline memory and elementary understanding.
`;
  } else if (level === 'hard') {
    return `
DIFFICULTY LEVEL: HARD
- Focus on deep conceptual understanding, multi-step logical reasoning, practical application, and tricky edge cases.
- Options must include closely related plausible distractors that require careful distinction.
- Questions should require higher-order analytical thinking.
`;
  }
  
  return `
DIFFICULTY LEVEL: MEDIUM
- Focus on conceptual comprehension, moderate problem-solving, and standard practical application.
- Options should test sound understanding of the subject matter with clear logical reasoning.
`;
}

/**
 * Removes duplicate questions from generated question array
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

/**
 * Clean and Extract text from buffer or string
 */
async function extractTextFromBuffer(buffer, mimetype) {
  try {
    if (mimetype === 'application/pdf' || buffer.toString('ascii', 0, 4) === '%PDF') {
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('[AI SERVICE] Text Extraction Error:', error);
    return '';
  }
}

/**
 * AI Question Generator Engine (Simulated/API Wrapper)
 */
async function generateAiQuestions(text, difficulty = 'medium', count = 10) {
  const promptInstruction = buildDifficultyPrompt(difficulty);
  console.log(`[AI SERVICE] Generating questions with prompt: ${difficulty.toUpperCase()}`);

  // Clean and trim text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ').slice(0, 1000).join(' ');

  // Extract key sentences for fallback generation
  const sentences = words.match(/[^.!?]+[.!?]+/g) || [words];
  const questions = [];

  for (let i = 0; i < Math.min(count, Math.max(5, sentences.length)); i++) {
    const baseSentence = (sentences[i] || `Concept reference ${i + 1}`).trim();
    
    let qText = "";
    let correctOpt = "";
    let options = [];

    if (difficulty === 'easy') {
      qText = `What is the primary definition or key term mentioned in: "${baseSentence.substring(0, 60)}..."?`;
      correctOpt = `Direct concept from: ${baseSentence.substring(0, 30)}`;
      options = [
        correctOpt,
        "Irrelevant concept not in text",
        "Incorrect definition statement",
        "Opposite meaning term"
      ];
    } else if (difficulty === 'hard') {
      qText = `Which complex implication or multi-step conclusion best follows from: "${baseSentence.substring(0, 80)}..."?`;
      correctOpt = `Analytical conclusion regarding ${baseSentence.substring(0, 30)}`;
      options = [
        correctOpt,
        `Slightly misstated principle of ${baseSentence.substring(0, 25)}`,
        "Plausible but logically flawed deduction",
        "Contradictory hypothesis based on edge cases"
      ];
    } else {
      qText = `Based on the material, which statement accurately reflects: "${baseSentence.substring(0, 70)}..."?`;
      correctOpt = `Correct explanation of ${baseSentence.substring(0, 30)}`;
      options = [
        correctOpt,
        "Partially correct statement with missing details",
        "Incorrect interpretation of concept",
        "Unrelated topic option"
      ];
    }

    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffledOptions.indexOf(correctOpt).toString();

    questions.push({
      questionId: new mongoose.Types.ObjectId().toString(),
      questionText: qText,
      options: shuffledOptions,
      correctAnswer: correctIndex,
      explanation: `Reference text: ${baseSentence}`
    });
  }

  return deduplicateQuestions(questions);
}

module.exports = {
  buildDifficultyPrompt,
  deduplicateQuestions,
  extractTextFromBuffer,
  generateAiQuestions
};