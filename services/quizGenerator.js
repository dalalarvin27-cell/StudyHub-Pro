const { callAIProvider } = require("./aiService");
const { cleanExtractedText, isGarbageText } = require("./ocrService");

function filterDuplicateQuestions(questions) {
  const seenTexts = new Set();
  const uniqueQuestions = [];

  for (const q of questions) {
    if (!q || !q.questionText) continue;
    const normalizedText = q.questionText.trim().toLowerCase().replace(/[^\w\s]/gi, '');
    
    if (!seenTexts.has(normalizedText)) {
      seenTexts.add(normalizedText);
      uniqueQuestions.push(q);
    }
  }

  return uniqueQuestions;
}

async function generateQuizFromNotes(cleanText, options = {}) {
  const numQuestions = options.questionsCount || 10;
  const difficulty = (options.difficulty || "Medium").toLowerCase();
  const sourceFile = options.sourceFile || "Uploaded Document";
  
  const sanitizedNotes = cleanExtractedText(cleanText);

  if (isGarbageText(sanitizedNotes)) {
    throw new Error("Unable to generate a new quiz from this document. Please upload a clearer PDF/image.");
  }

  console.log(`[QUIZ] New generation requested`);
  console.log(`[QUIZ] Source file: ${sourceFile}`);
  console.log(`[QUIZ] Difficulty: ${difficulty}`);

  let difficultyGuideline = "";
  if (difficulty === "easy" || difficulty === "low") {
    difficultyGuideline = "EASY DIFFICULTY: Focus on basic definitions, direct facts, simple recall, and straightforward concept questions.";
  } else if (difficulty === "hard") {
    difficultyGuideline = "HARD DIFFICULTY: Focus on deeper concepts, multi-step reasoning, tricky application problems, and closely related distractor options.";
  } else {
    difficultyGuideline = "MEDIUM DIFFICULTY: Focus on conceptual understanding, application-based questions, and moderate difficulty scenarios.";
  }

  const systemPrompt = `You are an expert exam paper generator. You must generate a quiz strictly from the document content provided below.
Use ONLY information contained in the document.
Do NOT invent facts.
Do NOT use generic/sample/demo questions.
If the document does not contain enough information to generate fresh questions, do not invent them.`;

  const userPrompt = `Generate exactly ${numQuestions} FRESH and UNIQUE multiple choice questions (MCQs) strictly based on the document content below.

STRICT DIFFICULTY GUIDELINE:
${difficultyGuideline}

STRICT RULE: Do NOT generate duplicate or near-duplicate questions. Every question must test a distinct concept or fact.

Return ONLY a valid JSON array of question objects without markdown code blocks or commentary.
JSON Format:
[
  {
    "questionText": "Question statement derived directly from document",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation supporting the answer from document text"
  }
]

Document Content (${sanitizedNotes.length} characters):
${sanitizedNotes.substring(0, 8000)}`;

  const aiResult = await callAIProvider(userPrompt, systemPrompt);

  if (!aiResult) {
    console.error("[QUIZ] AI provider returned empty response or API key missing.");
    throw new Error("Unable to generate a new quiz from this document. Please try again.");
  }

  let rawQuestions = [];
  try {
    let cleanJson = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
    rawQuestions = JSON.parse(cleanJson);
  } catch (e) {
    console.error("[QUIZ] Failed to parse AI JSON response:", e.message);
    throw new Error("Unable to generate a new quiz from this document. Please try again.");
  }

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error("Unable to generate a new quiz from this document. Please try again.");
  }

  const uniqueQuestions = filterDuplicateQuestions(rawQuestions);

  const validQuestions = uniqueQuestions.filter(q => {
    if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) return false;
    const containsPdfSyntax = /\/Parent|\/Resources|\/Font|\/ProcSet|FlateDecode|ASCII85Decode|endobj|stream/i.test(
      q.questionText + " " + q.options.join(" ")
    );
    return !containsPdfSyntax;
  });

  if (validQuestions.length === 0) {
    throw new Error("Unable to generate a new quiz from this document. Please try again.");
  }

  console.log(`[QUIZ] Generated question count: ${validQuestions.length}`);
  return validQuestions;
}

module.exports = { generateQuizFromNotes };
