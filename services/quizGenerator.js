const { callAIProvider } = require("./aiService");
const { cleanExtractedText, isGarbageText } = require("./ocrService");

function sanitizeExtractedText(text) {
  if (!text) return "";
  let clean = text
    .replace(/<<[\s\S]*?>>/g, ' ')
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, ' ')
    .replace(/stream[\s\S]*?endstream/gi, ' ')
    .replace(/Parent \d+ \d+ R|Resources|ProcSet|ImageB|ImageC|ImageI|Rotate \d+|PageMode|Catalog|CreationDate|ModDate|Producer|ReportLab|FlateDecode|ASCII85Decode/gi, ' ')
    .replace(/\/([A-Za-z0-9]+)/g, ' ')
    .replace(/[\/\<\>\{\}\[\]\\]/g, ' ')
    .replace(/[^\x20-\x7E\n\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

// Universal Multi-Branch, Multi-Language, Multi-Subject Classifier
function detectSubjectFromText(text = "", title = "") {
  const fileTitle = (title || "").toLowerCase();
  const bodyText = (text || "").toLowerCase();
  const combined = fileTitle + " " + bodyText;

  const isHindiText = /[\u0900-\u097F]/.test(text + title);

  // 1. Python & Programming Languages (Checked BEFORE Math!)
  if (fileTitle.match(/python|java|javascript|js|cpp|c\+\+|html|css|sql|dbms|programming|coding|code|syntax|data_structures|dsa/) ||
      combined.match(/python|def\s+|lambda|import\s+pandas|import\s+numpy|django|flask|print\(|java|class\s+|public\s+static|c\+\+|javascript|html|css|sql|select\s+from|database|data\s+structure|pointer|array|linked\s+list/)) {
    
    let progLang = "Programming & Computer Science";
    if (combined.includes("python")) progLang = "Python Programming";
    else if (combined.includes("java")) progLang = "Java Programming";
    else if (combined.includes("c++") || combined.includes("cpp")) progLang = "C++ Programming";
    else if (combined.includes("sql") || combined.includes("dbms")) progLang = "DBMS & SQL";

    return { subject: progLang, icon: "🐍", isHindi: isHindiText };
  }

  // 2. Hindi Language & Literature
  if (isHindiText || fileTitle.match(/hindi|vyakaran|sahitya|kavita/) || combined.match(/हिंदी|व्याकरण|गद्य|पद्य|साहित्य|समास|संधि|कारक|संज्ञा|सर्वनाम|पर्यायवाची/)) {
    return { subject: "Hindi Language & Literature", icon: "🇮🇳", isHindi: true };
  }

  // 3. Mechanical & Civil Engineering
  if (fileTitle.match(/mech|mechanical|civil|thermodynamics|fluid|cad|structure/) || 
      combined.match(/thermodynamics|fluid\s+mechanics|stress|strain|torque|engine|viscosity|concrete|beam|cad|cam|turbine/)) {
    return { subject: "Mechanical / Civil Engineering", icon: "⚙️", isHindi: isHindiText };
  }

  // 4. Electrical & Electronics Engineering
  if (fileTitle.match(/electrical|eee|ece|circuit|semiconductor|signal|transformer/) || 
      combined.match(/circuit|resistor|capacitor|inductor|semiconductor|diode|transistor|op-amp|signal\s+system|electromagnet/)) {
    return { subject: "Electrical & Electronics Engg", icon: "⚡", isHindi: isHindiText };
  }

  // 5. Commerce, Accounting & Economics
  if (fileTitle.match(/commerce|account|finance|economics|business|gst|tax/) || 
      combined.match(/accounting|journal|ledger|balance\s+sheet|debit|credit|microeconomics|macroeconomics|gdp|inflation|market/)) {
    return { subject: "Commerce & Economics", icon: "📈", isHindi: isHindiText };
  }

  // 6. Mathematics & Trigonometry
  if (fileTitle.match(/trigonometry|trig|math|calculus|algebra|geometry/) || 
      combined.match(/trigonometry|sin|cos|tan|cot|sec|cosec|calculus|integral|derivative|matrix|vector|algebra|pythagoras|identity/)) {
    return { subject: "Mathematics", icon: "📐", isHindi: isHindiText };
  }

  // 7. Physics
  if (fileTitle.match(/physics/) || 
      combined.match(/physics|velocity|force|acceleration|gravity|electric\s+field|current|light|optics|motion|momentum|voltage|watt|ohm|lens/)) {
    return { subject: "Physics", icon: "⚛️", isHindi: isHindiText };
  }

  // 8. Chemistry
  if (fileTitle.match(/chem|chemistry/) || 
      combined.match(/chemistry|chemical\s+reaction|element|acid|base|compound|mole|organic|periodic|bond|solution|atomic/)) {
    return { subject: "Chemistry", icon: "🧪", isHindi: isHindiText };
  }

  // 9. Biology
  if (fileTitle.match(/bio|biology/) || 
      combined.match(/biology|cell|dna|organism|botany|zoology|gene|plant|blood|heart|tissue|species|photosynthesis/)) {
    return { subject: "Biology", icon: "🧬", isHindi: isHindiText };
  }

  // 10. History
  if (fileTitle.match(/history/) || 
      combined.match(/history|war|king|dynasty|empire|battle|revol|century|british|india|freedom|movement|ancient|medieval/)) {
    return { subject: "History", icon: "🏛️", isHindi: isHindiText };
  }

  // 11. Geography
  if (fileTitle.match(/geo|geography/) || 
      combined.match(/geography|river|mountain|map|climate|soil|earth|ocean|atmosphere|state|border/)) {
    return { subject: "Geography", icon: "🌍", isHindi: isHindiText };
  }

  // 12. Polity & Law
  if (fileTitle.match(/polity|constitution|law|legal/) || 
      combined.match(/polity|constitution|article|parliament|president|court|rights|law|governance|jurisprudence/)) {
    return { subject: "Polity & Law", icon: "📜", isHindi: isHindiText };
  }

  // 13. English Language
  if (fileTitle.match(/english|grammar/) || 
      combined.match(/english|grammar|noun|verb|tense|idiom|synonym|antonym|passage|vocab/)) {
    return { subject: "English Language", icon: "📚", isHindi: false };
  }

  return { subject: title.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || "Uploaded Study Material", icon: "📄", isHindi: isHindiText };
}

async function generateQuizFromNotes(cleanText, options = {}) {
  const numQuestions = options.questionsCount || 10;
  const title = options.title || options.sourceFile || "";
  const difficulty = (options.difficulty || "Medium").toLowerCase();
  const sanitizedNotes = sanitizeExtractedText(cleanText);
  const subjectInfo = detectSubjectFromText(sanitizedNotes, title);

  console.log(`[QUIZ] Generating test for "${title}" | Subject: ${subjectInfo.subject} | Language: ${subjectInfo.isHindi ? 'Hindi' : 'English'}`);

  let questions = [];

  if (process.env.AI_API_KEY && process.env.AI_PROVIDER !== "mock") {
    const langInstruction = subjectInfo.isHindi ? "Generate the questions and options in HINDI language." : "Generate the questions and options in ENGLISH language.";
    
    const systemPrompt = `You are an expert exam paper generator for ${subjectInfo.subject}. ${langInstruction}
Generate a balanced test paper containing BOTH:
1. Definition & Conceptual Theory Questions
2. Output Prediction / Problem Solving Questions (where students calculate or trace code/formulas on paper)

Base all questions STRICTLY on the document content provided. Do NOT default to Mathematics unless the document is actually Mathematics.`;

    const userPrompt = `Generate exactly ${numQuestions} UNIQUE multiple choice questions (MCQs) for ${subjectInfo.subject}.\nDifficulty: ${difficulty}.\nReturn ONLY a valid JSON array: [{"questionText": "string", "options":["A","B","C","D"], "correctAnswer": 0, "explanation":"string"}]\n\nDocument Content:\n${sanitizedNotes.substring(0, 8000)}`;

    const aiResult = await callAIProvider(userPrompt, systemPrompt);

    if (aiResult) {
      try {
        let cleanJson = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed;
        }
      } catch (e) {}
    }
  }

  if (questions.length === 0) {
    const sentences = sanitizedNotes
      .split(/(?<=[.?!।])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 250 && !/obj|Parent|ProcSet|Decode/i.test(s));

    let diffOffset = 0;
    if (difficulty === "medium") diffOffset = 3;
    if (difficulty === "hard") diffOffset = 7;

    const subjectTopicBanks = {
      "Python Programming": [
        { text: "In Python, which keyword is used to define a user-defined function?", opts: ["def", "function", "func", "define"], correct: 0, exp: "The 'def' keyword is used to declare functions in Python." },
        { text: "Code Output Question: Solve on paper — What is the output of print(3 * '2') in Python?", opts: ["222", "6", "Error", "33"], correct: 0, exp: "String multiplication in Python repeats the string: '2' * 3 = '222'." },
        { text: "Which data structure in Python is mutable and enclosed in square brackets []?", opts: ["List", "Tuple", "Dictionary", "Set"], correct: 0, exp: "Lists in Python are mutable and created using square brackets []." },
        { text: "Predict Output: What will type([1, 2, 3]) return in Python?", opts: ["<class 'list'>", "<class 'tuple'>", "<class 'array'>", "<class 'dict'>"], correct: 0, exp: "[1, 2, 3] is a list object in Python." },
        { text: "Which builtin function returns the number of items in a list or string in Python?", opts: ["len()", "count()", "size()", "length()"], correct: 0, exp: "len() function returns length of sequences in Python." }
      ],
      "Hindi Language & Literature": [
        { text: "हिंदी व्याकरण में स्वर वर्णों की कुल संख्या कितनी मानी गई है?", opts: ["11", "13", "33", "52"], correct: 0, exp: "मानक हिंदी व्याकरण में मुख्य स्वरों की संख्या 11 है।" },
        { text: "दो वर्णों के मेल से होने वाले विकार या परिवर्तन को क्या कहते हैं?", opts: ["संधि", "समास", "कारक", "उपसर्ग"], correct: 0, exp: "दो समीपवर्ती वर्णों के मेल से जो विकार होता है, उसे संधि कहते हैं।" },
        { text: "जिस समास में दोनों पद प्रधान होते हैं, उसे क्या कहा जाता है?", opts: ["द्वंद्व समास", "द्विगु समास", "तत्पुरुष समास", "अव्ययीभाव समास"], correct: 0, exp: "द्वंद्व समास में दोनों पद (माता-पिता, राम-लक्ष्मण) प्रधान होते हैं।" }
      ],
      "Computer Science / IT": [
        { text: "Which SQL command is used to retrieve data from a database table?", opts: ["SELECT", "FETCH", "GET", "EXTRACT"], correct: 0, exp: "SELECT query is used to retrieve rows from database tables." },
        { text: "Which data structure follows the Last-In, First-Out (LIFO) order?", opts: ["Stack", "Queue", "Tree", "Graph"], correct: 0, exp: "Stack follows LIFO order for push and pop operations." }
      ],
      "Mechanical / Civil Engineering": [
        { text: "What is the formula for Stress (σ) in solid mechanics?", opts: ["Force / Area (F / A)", "Force * Distance", "Mass * Acceleration", "Work / Time"], correct: 0, exp: "Stress = Force per unit Area (σ = F/A)." },
        { text: "Which thermodynamic cycle is considered the most efficient ideal gas cycle?", opts: ["Carnot Cycle", "Rankine Cycle", "Otto Cycle", "Diesel Cycle"], correct: 0, exp: "Carnot cycle has maximum possible efficiency between two temperatures." }
      ],
      "Electrical & Electronics Engg": [
        { text: "What is Ohm's Law formula for Voltage (V)?", opts: ["V = I * R", "V = I / R", "V = I² * R", "V = R / I"], correct: 0, exp: "Ohm's Law: Voltage = Current * Resistance (V = IR)." },
        { text: "Which semiconductor device converts Alternating Current (AC) to Direct Current (DC)?", opts: ["Rectifier (Diode)", "Transformer", "Inductor", "Capacitor"], correct: 0, exp: "Diodes in a rectifier circuit convert AC to DC." }
      ]
    };

    const bank = subjectTopicBanks[subjectInfo.subject] || [];
    const seenQuestions = new Set();

    for (let i = 0; i < numQuestions; i++) {
      const sentIndex = (i + diffOffset) % Math.max(1, sentences.length);
      const sentence = sentences.length > 0 ? sentences[sentIndex] : "";
      const words = sentence.split(" ").filter(w => w.length > 3);
      const keyWord = words.length > 0 ? words[(i * 3 + diffOffset) % words.length] : `Concept ${i + 1}`;

      let qObj;

      if (sentence && sentence.length > 12) {
        if (subjectInfo.isHindi) {
          qObj = {
            questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] आपके नोट्स के अनुसार: "${keyWord}" के संबंध में कौन सा कथन सही है?`,
            options: [
              sentence,
              `यह ${keyWord} का विपरीत नियम प्रस्तुत करता है`,
              `यह एक अमान्य सिद्धांत है`,
              `उपरोक्त में से कोई नहीं`
            ],
            correctAnswer: 0,
            explanation: `आपके अपलोड किए गए ${subjectInfo.subject} नोट्स से: "${sentence}"`
          };
        } else if (subjectInfo.subject.includes("Programming") || subjectInfo.subject.includes("Computer")) {
          const isCodeOutputQ = (i % 2 === 1);
          if (isCodeOutputQ) {
            qObj = {
              questionText: `[Code / Output Analysis Q${i + 1}] Trace on Paper: Regarding "${keyWord}" in ${subjectInfo.subject}, what is the correct syntax / output behavior?`,
              options: [
                sentence,
                `Causes a SyntaxError due to invalid ${keyWord} declaration`,
                `Returns None without executing ${keyWord}`,
                `None of the above`
              ],
              correctAnswer: 0,
              explanation: `Derived from your ${subjectInfo.subject} notes: "${sentence}"`
            };
          } else {
            qObj = {
              questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] Regarding "${keyWord}": Which statement correctly explains its behavior?`,
              options: [
                sentence,
                `The inverse behavior of ${keyWord} in programming`,
                `An undefined keyword in standard syntax`,
                `None of the above`
              ],
              correctAnswer: 0,
              explanation: `Derived from your ${subjectInfo.subject} notes: "${sentence}"`
            };
          }
        } else {
          qObj = {
            questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] Regarding "${keyWord}": Which option correctly states the concept?`,
            options: [
              sentence,
              `The inverse formula of ${keyWord} in ${subjectInfo.subject}`,
              `Non-applicable condition in standard ${subjectInfo.subject}`,
              `None of the above`
            ],
            correctAnswer: 0,
            explanation: `Derived from your uploaded ${subjectInfo.subject} notes: "${sentence}"`
          };
        }
      } else if (i < bank.length) {
        const bItem = bank[(i + diffOffset) % bank.length];
        qObj = {
          questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] ${bItem.text}`,
          options: bItem.opts,
          correctAnswer: bItem.correct,
          explanation: bItem.exp
        };
      } else {
        const defaultQText = subjectInfo.isHindi 
          ? `[${subjectInfo.subject} ${subjectInfo.icon}] प्रश्न ${i + 1}: अपलोड की गई अध्ययन सामग्री "${subjectInfo.subject}" का मुख्य विषय क्या है?`
          : `[${subjectInfo.subject} ${subjectInfo.icon}] Question ${i + 1} (${difficulty.toUpperCase()} Level): What is the core concept covered in this ${subjectInfo.subject} material?`;

        const defaultOptions = subjectInfo.isHindi
          ? [`${subjectInfo.subject} के मुख्य नियम, परिभाषाएं एवं अध्याय के हल`, `अन्य विषय की ऐतिहासिक घटनाएं`, `अमान्य माप त्रुटियां`, `उपरोक्त में से कोई नहीं`]
          : [`Core principles, syntax, definitions, and solved problems of ${subjectInfo.subject}`, `Unrelated historical events outside ${subjectInfo.subject}`, `Measurement errors in non-standard units`, `None of the above`];

        qObj = {
          questionText: defaultQText,
          options: defaultOptions,
          correctAnswer: 0,
          explanation: `Derived from your uploaded ${subjectInfo.subject} study notes.`
        };
      }

      let uniqueQText = qObj.questionText;
      if (seenQuestions.has(uniqueQText)) {
        uniqueQText += ` (Part ${i + 1})`;
        qObj.questionText = uniqueQText;
      }
      seenQuestions.add(uniqueQText);

      questions.push(qObj);
    }
  }

  const validQuestions = questions.filter(q => {
    if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) return false;
    const containsPdfSyntax = /\/Parent|\/Resources|\/Font|\/ProcSet|FlateDecode|ASCII85Decode|endobj|stream/i.test(
      q.questionText + " " + q.options.join(" ")
    );
    return !containsPdfSyntax;
  });

  return validQuestions;
}

module.exports = { generateQuizFromNotes, detectSubjectFromText };
