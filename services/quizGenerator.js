const { callAIProvider } = require("./aiService");

// Universal Text Sanitizer (Strips ALL PDF Binary Code)
function sanitizeExtractedText(text) {
  if (!text) return "";

  let clean = text
    .replace(/<<[\s\S]*?>>/g, ' ')
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, ' ')
    .replace(/stream[\s\S]*?endstream/gi, ' ')
    .replace(/Parent \d+ \d+ R|Resources|ProcSet|ImageB|ImageC|ImageI|Rotate \d+|PageMode|Catalog|CreationDate|ModDate|Producer|ReportLab|FlateDecode|ASCII85Decode/gi, ' ')
    .replace(/\/([A-Za-z0-9]+)/g, ' ')
    .replace(/[\/\<\>\{\}\[\]\\]/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

// Dynamic Subject Classifier for ANY Subject
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
  const title = options.title || "";
  const sanitizedNotes = sanitizeExtractedText(cleanText);
  const subjectInfo = detectSubjectFromText(sanitizedNotes, title);

  // AI Prompt for Any Subject
  const prompt = `Based STRICTLY on the following study notes, generate ${numQuestions} multiple choice questions (MCQs) for the subject ${subjectInfo.subject}.\nReturn JSON array: [{questionText, options:[4 strings], correctAnswer:index, explanation:string}]\n\nNotes:\n${sanitizedNotes.substring(0, 3000)}`;

  const aiResult = await callAIProvider(prompt, "Return valid JSON array of questions [{questionText, options, correctAnswer, explanation}]");

  if (aiResult) {
    try {
      const parsed = JSON.parse(aiResult);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
  }

  // Universal Dynamic Fallback Generator from the user's extracted sentences
  const sentences = sanitizedNotes
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 250 && !/obj|Parent|ProcSet|Decode/i.test(s));

  const questions = [];

  for (let i = 0; i < numQuestions; i++) {
    if (sentences.length > 0 && i < sentences.length) {
      const sentence = sentences[i % sentences.length];
      const words = sentence.split(" ").filter(w => w.length > 3);
      const keyWord = words.length > 0 ? words[Math.floor(words.length / 2)] : "concept";

      questions.push({
        questionText: `According to your ${subjectInfo.subject} notes: Which statement correctly explains "${keyWord}"?`,
        options: [
          sentence,
          `The inverse principle of ${keyWord} in ${subjectInfo.subject}`,
          `An unverified exception in standard ${subjectInfo.subject}`,
          `None of the above statements apply`
        ],
        correctAnswer: 0,
        explanation: `Directly derived from your uploaded ${subjectInfo.subject} notes: "${sentence}"`,
        questionType: options.type || "MCQ"
      });
    } else {
      questions.push({
        questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] Q${i + 1}: What is the primary focus of the uploaded ${subjectInfo.subject} study material?`,
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

  return questions;
}

module.exports = { generateQuizFromNotes, detectSubjectFromText };
