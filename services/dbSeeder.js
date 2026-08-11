const mongoose = require("mongoose");

let MockTest, Question, PYQ, OnePager;
try {
  const models = require("../models");
  MockTest = models.MockTest || require("../models/MockTest");
  Question = models.Question || require("../models/Question");
  PYQ = models.PYQ || require("../models/PYQ");
  OnePager = models.OnePager || require("../models/OnePager");
} catch (e) {
  MockTest = require("../models/MockTest");
  Question = require("../models/Question");
  PYQ = require("../models/PYQ");
  OnePager = require("../models/OnePager");
}

async function seedDatabaseIfEmpty() {
  try {
    const testCount = await MockTest.countDocuments();
    if (testCount === 0) {
      console.log("🌱 Database is empty! Auto-seeding initial Mock Tests, PYQs & One-Pagers...");

      const ndaMathTest = new MockTest({
        title: "NDA Mathematics Full Mock Test 2026",
        category: "NDA",
        subject: "Mathematics",
        description: "Official pattern test covering Calculus, Algebra, Trigonometry & Coordinate Geometry.",
        totalQuestions: 5,
        totalMarks: 20,
        durationMinutes: 10,
        difficulty: "Medium",
        isPractice: true
      });
      await ndaMathTest.save();

      const mathQuestions = [
        {
          testId: ndaMathTest._id,
          questionText: "What is the value of sin^2(30°) + cos^2(30°)?",
          options: ["1", "0", "0.5", "2"],
          correctAnswer: 0,
          explanation: "By fundamental Pythagorean trigonometric identity, sin^2(theta) + cos^2(theta) = 1 for any angle theta.",
          subject: "Mathematics",
          topic: "Trigonometry"
        },
        {
          testId: ndaMathTest._id,
          questionText: "What is the derivative of d/dx (sin x * cos x)?",
          options: ["cos(2x)", "sin(2x)", "-sin(2x)", "cos^2(x)"],
          correctAnswer: 0,
          explanation: "sin(x)*cos(x) = 1/2 * sin(2x). Derivative d/dx [1/2 * sin(2x)] = 1/2 * 2 * cos(2x) = cos(2x).",
          subject: "Mathematics",
          topic: "Calculus"
        },
        {
          testId: ndaMathTest._id,
          questionText: "If A = [[1, 2], [3, 4]], what is the determinant |A|?",
          options: ["-2", "2", "10", "-10"],
          correctAnswer: 0,
          explanation: "Determinant |A| = (1*4) - (2*3) = 4 - 6 = -2.",
          subject: "Mathematics",
          topic: "Matrices & Determinants"
        },
        {
          testId: ndaMathTest._id,
          questionText: "What is the sum of roots of the quadratic equation x^2 - 5x + 6 = 0?",
          options: ["5", "-5", "6", "-6"],
          correctAnswer: 0,
          explanation: "For ax^2 + bx + c = 0, Sum of roots = -b/a = -(-5)/1 = 5.",
          subject: "Mathematics",
          topic: "Quadratic Equations"
        },
        {
          testId: ndaMathTest._id,
          questionText: "What is the value of lim(x->0) [sin(x) / x]?",
          options: ["1", "0", "Infinity", "Undefined"],
          correctAnswer: 0,
          explanation: "Standard calculus limit limit(x->0) sin(x)/x = 1.",
          subject: "Mathematics",
          topic: "Limits & Continuity"
        }
      ];

      for (const q of mathQuestions) { await new Question(q).save(); }

      const ndaGatTest = new MockTest({
        title: "NDA General Ability Test (GAT) Special",
        category: "NDA",
        subject: "General Ability Test",
        description: "Practice questions for English, Physics, Chemistry, Geography & Current Affairs.",
        totalQuestions: 4,
        totalMarks: 16,
        durationMinutes: 8,
        difficulty: "Medium",
        isPractice: true
      });
      await ndaGatTest.save();

      const gatQuestions = [
        {
          testId: ndaGatTest._id,
          questionText: "Which fundamental law of physics states F = ma?",
          options: ["Newton's Second Law of Motion", "Newton's First Law of Motion", "Newton's Third Law of Motion", "Law of Gravitation"],
          correctAnswer: 0,
          explanation: "Newton's Second Law states that force equals mass times acceleration (F = ma).",
          subject: "Physics",
          topic: "Laws of Motion"
        },
        {
          testId: ndaGatTest._id,
          questionText: "What is the pH value of pure distilled water at 25°C?",
          options: ["7", "0", "14", "1"],
          correctAnswer: 0,
          explanation: "Pure distilled water is neutral with a pH of 7.",
          subject: "Chemistry",
          topic: "Acids, Bases & pH"
        },
        {
          testId: ndaGatTest._id,
          questionText: "Which Article of the Indian Constitution guarantees the Right to Equality?",
          options: ["Article 14 to 18", "Article 19 to 22", "Article 21A", "Article 32"],
          correctAnswer: 0,
          explanation: "Articles 14 to 18 of the Constitution of India deal with the Right to Equality.",
          subject: "Polity",
          topic: "Fundamental Rights"
        },
        {
          testId: ndaGatTest._id,
          questionText: "Which is the longest river in India?",
          options: ["Ganga", "Godavari", "Yamuna", "Brahmaputra"],
          correctAnswer: 0,
          explanation: "The Ganga is the longest river flowing entirely within India (2,525 km).",
          subject: "Geography",
          topic: "Indian Rivers"
        }
      ];

      for (const q of gatQuestions) { await new Question(q).save(); }

      const samplePYQs = [
        {
          exam: "NDA",
          year: 2024,
          subject: "Mathematics",
          topic: "Trigonometry",
          questionText: "What is the value of tan(15°)?",
          options: ["2 - √3", "2 + √3", "√3 - 1", "√3 + 1"],
          correctAnswer: 0,
          explanation: "tan(15°) = tan(45° - 30°) = (1 - 1/√3)/(1 + 1/√3) = (√3 - 1)/(√3 + 1) = 2 - √3.",
          source: "NDA I 2024 Official Paper"
        },
        {
          exam: "NDA",
          year: 2024,
          subject: "Physics",
          topic: "Optics",
          questionText: "What is the focal length of a plane mirror?",
          options: ["Infinity", "Zero", "10 cm", "-10 cm"],
          correctAnswer: 0,
          explanation: "A plane mirror is flat, so its radius of curvature and focal length are infinite.",
          source: "NDA I 2024 Official Paper"
        }
      ];

      for (const pyq of samplePYQs) { await new PYQ(pyq).save(); }

      const sampleOnePagers = [
        {
          title: "Class 12 Physics Complete Formula Sheet",
          subject: "Physics",
          topic: "Electrostatics & Magnetism",
          summaryText: "Comprehensive high-yield formula sheet covering Electrostatics, Electric Field, Gauss Law, Capacitance, and Electromagnetic Induction.",
          keyPoints: [
            "Coulomb Law: F = (1 / 4*pi*e0) * (q1*q2 / r^2)",
            "Electric Field: E = F / q = k*Q / r^2",
            "Gauss Law: Total Flux = Enclosed Charge / e0",
            "Capacitance of Parallel Plate: C = e0 * A / d"
          ],
          formulas: [
            { name: "Coulomb Constant (k)", formula: "8.9875 * 10^9 N m^2 / C^2" },
            { name: "Electric Potential (V)", formula: "V = k*Q / r" },
            { name: "Energy Stored in Capacitor", formula: "U = 1/2 * C * V^2" }
          ],
          mnemonics: [
            { title: "Right Hand Thumb Rule", trick: "Thumb points in direction of current I, curled fingers show Magnetic Field B" }
          ],
          examTips: [
            "Always check SI units (Coulombs, Volts, Farads) before calculation",
            "Remember that Electric Field lines never intersect each other"
          ]
        },
        {
          title: "NDA Mathematics Integration Shortcuts & Formulas",
          subject: "Mathematics",
          topic: "Calculus",
          summaryText: "Quick revision formula sheet for Definite & Indefinite Integrals, Integration by Parts, and Differential Equations.",
          keyPoints: [
            "Integration by Parts: Integral(u dv) = u*v - Integral(v du)",
            "Property: Integral(a to b f(x) dx) = Integral(a to b f(a+b-x) dx)",
            "Even Function Integral(-a to a f(x)dx) = 2 * Integral(0 to a f(x)dx)"
          ],
          formulas: [
            { name: "Integral sin(x)", formula: "-cos(x) + C" },
            { name: "Integral 1/x", formula: "ln|x| + C" },
            { name: "Integral e^(ax)", formula: "(1/a) * e^(ax) + C" }
          ],
          mnemonics: [
            { title: "ILATE Rule for Integration by Parts", trick: "Inverse, Logarithmic, Algebraic, Trigonometric, Exponential" }
          ],
          examTips: [
            "Use ILATE rule to choose 'u' first when using integration by parts",
            "Check for symmetry if integral bounds are -a to +a"
          ]
        }
      ];

      for (const op of sampleOnePagers) { await new OnePager(op).save(); }

      console.log("✅ Auto-seeding completed successfully!");
    }
  } catch (err) {
    console.error("DB Seeder Error:", err.message);
  }
}

module.exports = { seedDatabaseIfEmpty };
