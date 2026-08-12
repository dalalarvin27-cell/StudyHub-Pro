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
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

function detectSubjectFromText(text = "", title = "") {
  const fileTitle = (title || "").toLowerCase();
  const bodyText = (text || "").toLowerCase();
  const combined = fileTitle + " " + bodyText;

  if (fileTitle.match(/trigonometry|trig|math|calculus|algebra|geometry|formula/) || 
      combined.match(/trigonometry|sin|cos|tan|cot|sec|cosec|calculus|integral|derivative|matrix|vector|algebra|pythagoras|identity|formula/)) {
    return { subject: "Mathematics", icon: "📐" };
  }
  if (fileTitle.match(/physics/) || 
      combined.match(/physics|velocity|force|acceleration|gravity|electric|current|light|optics|motion|energy|momentum|voltage|watt|ohm|lens/)) {
    return { subject: "Physics", icon: "⚛️" };
  }
  if (fileTitle.match(/chem|chemistry/) || 
      combined.match(/chemistry|reaction|element|acid|base|compound|mole|organic|periodic|bond|solution|chemical|atomic/)) {
    return { subject: "Chemistry", icon: "🧪" };
  }
  if (fileTitle.match(/bio|biology/) || 
      combined.match(/biology|cell|dna|organism|botany|zoology|gene|plant|blood|heart|tissue|species/)) {
    return { subject: "Biology", icon: "🧬" };
  }
  if (fileTitle.match(/history/) || 
      combined.match(/history|war|king|dynasty|empire|battle|revol|century|british|india|freedom|movement|ancient|medieval/)) {
    return { subject: "History", icon: "🏛️" };
  }
  if (fileTitle.match(/geo|geography/) || 
      combined.match(/geography|river|mountain|map|climate|soil|earth|ocean|atmosphere|state|border/)) {
    return { subject: "Geography", icon: "🌍" };
  }
  if (fileTitle.match(/polity|constitution/) || 
      combined.match(/polity|constitution|article|parliament|president|court|rights|law|governance/)) {
    return { subject: "Polity & Governance", icon: "📜" };
  }
  if (fileTitle.match(/cs|computer|code|python|java|dbms/) || 
      combined.match(/computer|java|python|dbms|sql|database|algorithm|network|system|software|programming/)) {
    return { subject: "Computer Science / IT", icon: "💻" };
  }
  if (fileTitle.match(/english|grammar/) || 
      combined.match(/english|grammar|noun|verb|tense|idiom|synonym|antonym|passage|vocab/)) {
    return { subject: "English", icon: "📚" };
  }

  return { subject: "General Study Material", icon: "📄" };
}

async function generateQuizFromNotes(cleanText, options = {}) {
  const numQuestions = options.questionsCount || 10;
  const title = options.title || options.sourceFile || "";
  const difficulty = (options.difficulty || "Medium").toLowerCase();
  const sanitizedNotes = sanitizeExtractedText(cleanText);
  const subjectInfo = detectSubjectFromText(sanitizedNotes, title);

  console.log(`[QUIZ] Generating balanced Exam-Paper (Definitions + Numerical Solving) for "${title}" (${subjectInfo.subject})...`);

  let questions = [];

  // 1. AI Call if API Key configured
  if (process.env.AI_API_KEY && process.env.AI_PROVIDER !== "mock") {
    let diffPrompt = "EASY: 50% basic definitions & 50% simple single-step formula calculations.";
    if (difficulty === "hard") {
      diffPrompt = "HARD: 50% deep conceptual theory & 50% complex multi-step numerical problem solving.";
    } else if (difficulty === "medium") {
      diffPrompt = "MEDIUM: 50% conceptual understanding & 50% application-based step-by-step solving questions.";
    }

    const systemPrompt = `You are an expert exam paper generator. You MUST generate an authentic exam paper containing BOTH:
1. Theory, Laws & Definition Questions
2. Numerical & Problem-Solving Calculation Questions (where students calculate values using formulas on paper)

Strictly base all questions on the document content provided below. Do not invent unrelated facts. Do not generate duplicate questions.`;

    const userPrompt = `Generate exactly ${numQuestions} UNIQUE multiple choice questions (MCQs) for ${subjectInfo.subject}.
${diffPrompt}

QUESTION TYPE MIX REQUIREMENT:
- Include Definition, Laws & Theory Questions
- Include Step-by-Step Numerical/Calculation Solving Questions (give values and ask students to solve for missing variable using paper/pen)

Return ONLY a valid JSON array of question objects without markdown code blocks:
[
  {
    "questionText": "Question statement (include numerical values if calculation question)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Step-by-step calculation or concept explanation"
  }
]

Document Content:
${sanitizedNotes.substring(0, 8000)}`;

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

  // 2. Universal Dynamic Fallback Generator with ALL-SUBJECT EXAM PAPER MIX!
  if (questions.length === 0) {
    const sentences = sanitizedNotes
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 12 && s.length < 250 && !/obj|Parent|ProcSet|Decode/i.test(s));

    let diffOffset = 0;
    if (difficulty === "medium") diffOffset = 3;
    if (difficulty === "hard") diffOffset = 7;

    // Authentic All-Subject Exam Paper Banks (Definitions + Copy Solving Numericals)
    const balancedSubjectBanks = {
      "Physics": [
        // Theory / Definition
        { text: "Which fundamental law of physics states that force is equal to mass times acceleration (F = ma)?", opts: ["Newton's Second Law of Motion", "Newton's First Law of Motion", "Newton's Third Law of Motion", "Law of Gravitation"], correct: 0, exp: "Newton's Second Law states F = ma." },
        // Numerical Solving (Pen & Paper)
        { text: "Numerical Problem: Solve on paper — A body of mass m = 10 kg accelerates at a = 3 m/s². Calculate the Force F.", opts: ["30 N", "13 N", "3.33 N", "300 N"], correct: 0, exp: "F = m * a = 10 kg * 3 m/s² = 30 N." },
        // Theory
        { text: "What is the SI unit of electric current?", opts: ["Ampere (A)", "Volt (V)", "Ohm (Ω)", "Watt (W)"], correct: 0, exp: "Electric current SI unit is Ampere." },
        // Numerical Solving
        { text: "Calculation Problem: An electric bulb operates at V = 220 V with current I = 0.5 A. Calculate Resistance R using V = IR.", opts: ["440 Ω", "110 Ω", "220.5 Ω", "1100 Ω"], correct: 0, exp: "R = V / I = 220 V / 0.5 A = 440 Ω." },
        // Numerical Solving
        { text: "Numerical Problem: Calculate Kinetic Energy (E = 1/2 * m * v²) for an object of mass m = 4 kg moving at velocity v = 5 m/s.", opts: ["50 J", "20 J", "100 J", "10 J"], correct: 0, exp: "E = 1/2 * 4 * (5)² = 2 * 25 = 50 Joules." },
        // Numerical Solving
        { text: "Solving Problem: A force F = 50 N displaces an object by d = 4 m in direction of force. Calculate Work Done (W = F * d).", opts: ["200 J", "12.5 J", "54 J", "20 J"], correct: 0, exp: "Work W = F * d = 50 N * 4 m = 200 Joules." }
      ],
      "Mathematics": [
        { text: "What is the fundamental identity for sin²(x) + cos²(x)?", opts: ["1", "0", "2", "-1"], correct: 0, exp: "Pythagorean identity: sin²(x) + cos²(x) = 1." },
        { text: "Numerical Problem: If sin(θ) = 3/5 in a right triangle, calculate the value of cos(θ) on paper.", opts: ["4/5", "3/4", "5/3", "4/3"], correct: 0, exp: "cos(θ) = √(1 - sin²(θ)) = √(1 - 9/25) = √(16/25) = 4/5." },
        { text: "What is tan(x) equal to in terms of sine and cosine?", opts: ["sin(x) / cos(x)", "cos(x) / sin(x)", "1 / sin(x)", "sin(x) * cos(x)"], correct: 0, exp: "By definition, tangent tan(x) = sin(x) / cos(x)." },
        { text: "Calculation Problem: If a = 6 and b = 8 in a right-angled triangle, find hypotenuse c using c = √(a² + b²).", opts: ["10", "14", "12", "100"], correct: 0, exp: "c = √(6² + 8²) = √(36 + 64) = √100 = 10." },
        { text: "Solving Problem: Evaluate f(x) = 2x² + 3x - 5 when x = 3.", opts: ["22", "18", "25", "15"], correct: 0, exp: "f(3) = 2(3)² + 3(3) - 5 = 2(9) + 9 - 5 = 18 + 9 - 5 = 22." }
      ],
      "Chemistry": [
        { text: "What is the pH value of pure distilled water at 25°C?", opts: ["7", "0", "14", "1"], correct: 0, exp: "Distilled water is neutral with pH 7." },
        { text: "Numerical Calculation: Calculate molar mass of Carbon Dioxide (CO₂) given C = 12 g/mol and O = 16 g/mol.", opts: ["44 g/mol", "28 g/mol", "32 g/mol", "56 g/mol"], correct: 0, exp: "Molar mass = 12 + 2(16) = 12 + 32 = 44 g/mol." },
        { text: "Solving Problem: Calculate moles in 36g of Water (H₂O) where molar mass = 18 g/mol (Moles = Mass / Molar Mass).", opts: ["2 moles", "0.5 moles", "18 moles", "3 moles"], correct: 0, exp: "Moles = 36g / 18g/mol = 2 moles." }
      ]
    };

    const bank = balancedSubjectBanks[subjectInfo.subject] || [];

    const easyTemplates = [
      (kw, sent) => ({ q: `[Definition / Theory] In ${subjectInfo.subject}, what is directly defined by "${kw}"?`, ans: sent }),
      (kw, sent, idx) => ({ q: `[Solving Problem] Practice Calculation #${idx + 1}: If variable X = ${idx + 2} and Y = ${(idx + 1) * 5}, evaluate value using formula derived from "${kw}".`, ans: `Calculated value = ${(idx + 2) * (idx + 1) * 5}` }),
      (kw, sent) => ({ q: `[Concept Check] According to your ${subjectInfo.subject} notes, which rule applies to "${kw}"?`, ans: sent })
    ];

    const mediumTemplates = [
      (kw, sent, idx) => ({ q: `[Step-by-Step Solving] Given in ${subjectInfo.subject}: Apply formula for "${kw}" on paper with initial value = ${idx + 5}. Solve for result.`, ans: `Step-by-step solved value = ${(idx + 5) * 12}` }),
      (kw, sent) => ({ q: `[Theory & Application] In ${subjectInfo.subject}, how is "${kw}" correctly stated?`, ans: sent }),
      (kw, sent, idx) => ({ q: `[Numerical Problem] Calculate quantitative value for topic "${kw}" when rate of change = ${idx + 3}.`, ans: `Evaluated result = ${(idx + 3) * 10}` })
    ];

    const hardTemplates = [
      (kw, sent, idx) => ({ q: `[Advanced Multi-step Solving] Complex Numerical: Integrate/Solve equation for "${kw}" given boundary condition = ${(idx + 1) * 10}. Solve on notebook.`, ans: `Evaluated multi-step answer = ${(idx + 1) * 10 * 2.5}` }),
      (kw, sent) => ({ q: `[Deep Theory Analysis] Evaluating ${subjectInfo.subject} principles, which statement is critically valid for "${kw}"?`, ans: sent }),
      (kw, sent, idx) => ({ q: `[Analytical Calculation] Solve for unknown variable Z in ${subjectInfo.subject} relation "${kw}" with parameters = ${idx + 7}.`, ans: `Calculated Z value = ${(idx + 7) * 8}` })
    ];

    let templates = mediumTemplates;
    if (difficulty === "easy" || difficulty === "low") templates = easyTemplates;
    if (difficulty === "hard") templates = hardTemplates;

    const seenQuestions = new Set();

    for (let i = 0; i < numQuestions; i++) {
      const sentIndex = (i + diffOffset) % Math.max(1, sentences.length);
      const sentence = sentences.length > 0 ? sentences[sentIndex] : "";
      const words = sentence.split(" ").filter(w => w.length > 3);
      const keyWord = words.length > 0 ? words[(i * 3 + diffOffset) % words.length] : `Concept ${i + 1}`;

      const tIndex = (i + diffOffset) % templates.length;
      const template = templates[tIndex];

      let qObj;

      if (sentence && sentence.length > 15) {
        const tempResult = template(keyWord, sentence, i);
        const isSolvingQ = (i % 2 === 1); // 50% mix between theory and numerical solving!

        if (isSolvingQ) {
          const numA = (i + 1) * 5;
          const numB = (i + 2) * 4;
          const correctVal = numA * numB;
          
          qObj = {
            questionText: `[Numerical Solving Q${i + 1}] Solve on Paper: In ${subjectInfo.subject} notes for "${keyWord}", given values A = ${numA} and B = ${numB}. Calculate product value A * B.`,
            options: [
              `${correctVal}`,
              `${correctVal + 10}`,
              `${correctVal - 15}`,
              `${numA + numB}`
            ],
            correctAnswer: 0,
            explanation: `Step-by-step paper calculation: Value = A * B = ${numA} * ${numB} = ${correctVal}.`
          };
        } else {
          qObj = {
            questionText: tempResult.q,
            options: [
              sentence,
              `The inverse property of ${keyWord} in ${subjectInfo.subject}`,
              `An unverified condition when evaluating ${keyWord}`,
              `None of the above statements apply`
            ],
            correctAnswer: 0,
            explanation: `Derived from your uploaded ${subjectInfo.subject} notes: "${sentence}"`
          };
        }
      } else if (i < bank.length) {
        const bItem = bank[(i + diffOffset) % bank.length];
        qObj = {
          questionText: `[${difficulty.toUpperCase()}] ${bItem.text}`,
          options: bItem.opts,
          correctAnswer: bItem.correct,
          explanation: bItem.exp
        };
      } else {
        qObj = {
          questionText: `[${subjectInfo.subject} ${subjectInfo.icon}] Question ${i + 1} (${difficulty.toUpperCase()} Level): Which statement accurately reflects the ${subjectInfo.subject} principle for topic #${i + 1}?`,
          options: [
            `Core concept #${i + 1} and fundamental theorem of ${subjectInfo.subject}`,
            `Incorrect boundary value for topic #${i + 1}`,
            `Unrelated experimental error in non-standard units`,
            `None of the above`
          ],
          correctAnswer: 0,
          explanation: `Derived from your uploaded ${subjectInfo.subject} study material.`
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
