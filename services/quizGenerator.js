const { callAIProvider } = require("./aiService");
const { cleanExtractedText, isGarbageText } = require("./ocrService");

function detectSubjectFromText(text, title = "") {
  const combined = (text + " " + title).toLowerCase();

  if (combined.match(/physics|velocity|force|acceleration|gravity|electric|current|atom|light|optics|motion|energy|mass|momentum|voltage/)) {
    return { subject: "Physics", icon: "⚛️" };
  }
  if (combined.match(/chemistry|reaction|element|acid|base|compound|mole|organic|periodic|bond|solution|equation|metal/)) {
    return { subject: "Chemistry", icon: "🧪" };
  }
  if (combined.match(/math|calculus|trigonometry|integral|derivative|matrix|vector|equation|sin|cos|tan|algebra|geometry|theorem/)) {
    return { subject: "Mathematics", icon: "📐" };
  }
  if (combined.match(/biology|cell|dna|organism|botany|zoology|gene|plant|blood|heart|system|body|tissue|species/)) {
    return { subject: "Biology", icon: "🧬" };
  }
  if (combined.match(/history|war|king|dynasty|empire|battle|revol|century|british|india|freedom|movement|ancient|medieval/)) {
    return { subject: "History", icon: "🏛️" };
  }
  if (combined.match(/geography|river|mountain|map|climate|soil|earth|ocean|atmosphere|state|border|forest|crop/)) {
    return { subject: "Geography", icon: "🌍" };
  }
  if (combined.match(/polity|constitution|article|parliament|president|court|rights|law|governance|minister|commiss/)) {
    return { subject: "Polity & Governance", icon: "📜" };
  }
  if (combined.match(/computer|java|python|dbms|sql|database|algorithm|network|system|code|software|programming|cpu/)) {
    return { subject: "Computer Science / IT", icon: "💻" };
  }
  if (combined.match(/english|grammar|noun|verb|tense|idiom|synonym|antonym|passage|vocab|preposition/)) {
    return { subject: "English", icon: "📚" };
  }

  return { subject: "General Study Material", icon: "📄" };
}

async function generateQuizFromNotes(cleanText, options = {}) {
  const numQuestions = options.questionsCount || 10;
  const sanitizedNotes = cleanExtractedText(cleanText);

  if (isGarbageText(sanitizedNotes)) {
    throw new Error("Could not read meaningful text from this document. Please upload a clearer PDF/image.");
  }

  console.log(`[QUIZ] Generating quiz from uploaded content (${sanitizedNotes.length} chars)...`);

  let questions = [];

  // 1. Try AI Provider if API Key is configured
  if (process.env.AI_API_KEY && process.env.AI_PROVIDER !== "mock") {
    const systemPrompt = `You are generating a quiz strictly from the document content provided below. Use only information contained in the document. Do not invent facts. Do not use generic/sample questions. If the document does not contain enough information to answer a question, do not create that question.`;

    const userPrompt = `Generate exactly ${numQuestions} multiple choice questions (MCQs) strictly based on the document content below. Difficulty level: ${options.difficulty || "Medium"}.\nReturn ONLY a valid JSON array of question objects without markdown backticks.\nFormat: [{"questionText": "string", "options":["A","B","C","D"], "correctAnswer": 0, "explanation":"string"}]\n\nDocument Content:\n${sanitizedNotes.substring(0, 8000)}`;

    const aiResult = await callAIProvider(userPrompt, systemPrompt);

    if (aiResult) {
      try {
        let cleanJson = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed;
        }
      } catch (e) {
        console.warn("[QUIZ] AI JSON parse fallback.");
      }
    }
  }

  // 2. Smart Document Sentence Extractor (Works even without AI API key!)
  if (questions.length === 0) {
    console.log("[QUIZ] Generating quiz using Smart Document NLP Extractor...");
    const subjectInfo = detectSubjectFromText(sanitizedNotes, options.title || "");

    const sentences = sanitizedNotes
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 250 && !/obj|Parent|ProcSet|Decode/i.test(s));

    for (let i = 0; i < numQuestions; i++) {
      if (sentences.length > 0 && i < sentences.length) {
        const sentence = sentences[i % sentences.length];
        const words = sentence.split(" ").filter(w => w.length > 3);
        const keyWord = words.length > 0 ? words[Math.floor(words.length / 2)] : "concept";

        questions.push({
          questionText: `According to your ${subjectInfo.subject} notes: Which statement correctly explains "${keyWord}"?`,
          options: [
            sentence,
            `The inverse application of ${keyWord} in ${subjectInfo.subject}`,
            `An unverified exception in standard ${subjectInfo.subject}`,
            `None of the above statements apply`
          ],
          correctAnswer: 0,
          explanation: `Directly derived from your uploaded ${subjectInfo.subject} notes: "${sentence}"`,
          questionType: options.type || "MCQ"
        });
      } else {
        questions.push({
          questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] Q${i + 1}: What is a primary focus of the uploaded ${subjectInfo.subject} study material?`,
          options: [
            `Core principles, definitions, and chapter formulas of ${subjectInfo.subject}`,
            `Unrelated historical events outside ${subjectInfo.subject}`,
            `Experimental errors under non-standard conditions`,
            `None of the above`
          ],
          correctAnswer: 0,
          explanation: `Derived from your uploaded ${subjectInfo.subject} study document.`,
          questionType: options.type || "MCQ"
        });
      }
    }
  }

  // 3. Final verification against PDF syntax
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

module.exports = { generateQuizFromNotes, detectSubjectFromText };
