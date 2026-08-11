const { callAIProvider } = require("./aiService");
const { cleanExtractedText, isGarbageText } = require("./ocrService");

async function generateQuizFromNotes(cleanText, options = {}) {
  const numQuestions = options.questionsCount || 10;
  const sanitizedNotes = cleanExtractedText(cleanText);

  if (isGarbageText(sanitizedNotes)) {
    throw new Error("Could not read meaningful text from this document. Please upload a clearer PDF/image.");
  }

  console.log(`[QUIZ] Generating quiz from uploaded content (${sanitizedNotes.length} chars)...`);

  const systemPrompt = `You are generating a quiz strictly from the document content provided below.
Use only information contained in the document.
Do not invent facts.
Do not use generic/sample questions.
If the document does not contain enough information to answer a question, do not create that question.`;

  const userPrompt = `Generate exactly ${numQuestions} multiple choice questions (MCQs) strictly based on the document content below.
Difficulty level: ${options.difficulty || "Medium"}.

Return ONLY a valid JSON array of question objects without markdown backticks or commentary.
JSON Format:
[
  {
    "questionText": "Question statement derived directly from document",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation based on the document text"
  }
]

Document Content:
${sanitizedNotes.substring(0, 8000)}`;

  const aiResult = await callAIProvider(userPrompt, systemPrompt);

  if (!aiResult) {
    throw new Error("AI generation unavailable. Please configure an AI API key (AI_API_KEY) in server environment.");
  }

  let questions = [];
  try {
    let cleanJson = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
    questions = JSON.parse(cleanJson);
  } catch (e) {
    console.error("[QUIZ] Error parsing AI JSON response:", e.message);
    throw new Error("Failed to parse questions generated from document. Please try again.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Document content was insufficient to generate valid questions. Please upload notes with more detailed text.");
  }

  const validQuestions = questions.filter(q => {
    if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) return false;
    
    const containsPdfSyntax = /\/Parent|\/Resources|\/Font|\/ProcSet|FlateDecode|ASCII85Decode|endobj|stream/i.test(
      q.questionText + " " + q.options.join(" ")
    );
    return !containsPdfSyntax;
  });

  if (validQuestions.length === 0) {
    throw new Error("Could not read meaningful text from this document. Please upload a clearer PDF/image.");
  }

  return validQuestions;
}

module.exports = { generateQuizFromNotes };