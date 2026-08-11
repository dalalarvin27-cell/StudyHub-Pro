/**
 * EduVault Mock Test Frontend Engine
 * Handles Timer, Auto-Submit, Manual Submit, and Quiz Navigation
 */

let timerInterval = null;
let currentSecondsLeft = 0;
let isTestSubmitted = false;

/**
 * Launch Test Series
 */
window.startTest = function(testDataOrId) {
  try {
    console.log("[MOCK ENGINE] Launching test...", testDataOrId);

    let testId = null;
    let quizObject = null;

    if (typeof testDataOrId === 'string') {
      testId = testDataOrId;
    } else if (typeof testDataOrId === 'object' && testDataOrId !== null) {
      quizObject = testDataOrId;
      testId = testDataOrId.testId || testDataOrId._id;
    }

    if (!quizObject) {
      const stored = localStorage.getItem("currentQuiz");
      if (stored) {
        try { quizObject = JSON.parse(stored); } catch(e){}
      }
    }

    if (quizObject) {
      localStorage.setItem("currentQuiz", JSON.stringify(quizObject));
      sessionStorage.setItem("currentQuiz", JSON.stringify(quizObject));
    }

    if (!testId && quizObject) {
      testId = quizObject.testId || quizObject._id;
    }

    if (!testId) {
      alert("Unable to launch test. Test ID is missing.");
      return;
    }

    window.location.href = `/mock-tests.html?id=${testId}`;
  } catch (error) {
    console.error("[MOCK ENGINE ERROR] startTest failed:", error);
    alert("Error launching test series. Please try again.");
  }
};

/**
 * Generate & Launch Custom Test
 */
window.generateAndLaunchCustomTest = async function(formData) {
  try {
    // Clear stale state
    localStorage.removeItem("currentQuiz");
    sessionStorage.removeItem("currentQuiz");

    const response = await fetch("/api/mock-tests/generate", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result && result.success) {
      const quizData = result.data || result.quiz;
      localStorage.setItem("currentQuiz", JSON.stringify(quizData));
      window.startTest(quizData);
    } else {
      alert(result.message || "Unable to generate a new quiz. Please try again.");
    }
  } catch (err) {
    console.error("[MOCK ENGINE] Generation failed:", err);
    alert("Unable to generate a new quiz from this document. Please try again.");
  }
};

/**
 * Initialize Test Timer (5, 10, 15 mins)
 */
window.initTestTimer = function(durationInMins) {
  const duration = parseInt(durationInMins, 10) || 10;
  currentSecondsLeft = duration * 60;
  isTestSubmitted = false;

  const timerDisplay = document.getElementById("timerDisplay");
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (isTestSubmitted) return;

    if (currentSecondsLeft <= 0) {
      clearInterval(timerInterval);
      if (timerDisplay) timerDisplay.innerText = "00:00";
      window.autoSubmitMockTest();
    } else {
      currentSecondsLeft--;
      if (timerDisplay) {
        const m = Math.floor(currentSecondsLeft / 60);
        const s = currentSecondsLeft % 60;
        timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
    }
  }, 1000);
};

/**
 * Auto Submit on 00:00
 */
window.autoSubmitMockTest = function() {
  alert("⏰ Time is up! Your test is being submitted automatically.");
  window.processMockTestSubmission();
};

/**
 * Manual Submit Button Listener with Confirmation
 */
window.manualSubmitMockTest = function() {
  const confirmed = window.confirm("Are you sure you want to submit the test?");
  if (confirmed) {
    if (timerInterval) clearInterval(timerInterval);
    window.processMockTestSubmission();
  }
};

/**
 * Process Submission & Lock Options
 */
window.processMockTestSubmission = function() {
  isTestSubmitted = true;

  // Lock options
  const inputs = document.querySelectorAll('input[type="radio"]');
  inputs.forEach(i => i.disabled = true);

  // Hide Submit Button
  const submitBtn = document.getElementById("manualSubmitBtn");
  if (submitBtn) submitBtn.style.display = "none";

  // Compute Score
  const cached = localStorage.getItem("currentQuiz");
  if (cached) {
    try {
      const quiz = JSON.parse(cached);
      let score = 0;
      const total = quiz.questions.length;

      quiz.questions.forEach((q, idx) => {
        const qKey = q.questionId || idx;
        const selected = document.querySelector(`input[name="q_${qKey}"]:checked`);
        if (selected && String(selected.value) === String(q.correctAnswer)) {
          score++;
        }
      });

      const percentage = Math.round((score / total) * 100);
      const banner = document.getElementById("resultBanner");
      if (banner) {
        banner.classList.remove("hidden");
        banner.innerHTML = `
          <div class="p-4 bg-green-100 border border-green-300 rounded-lg text-center my-4">
            <h3 class="text-xl font-bold text-green-800">Test Submitted Successfully!</h3>
            <p class="text-lg text-green-700 font-semibold mt-1">Your Score: ${score} / ${total} (${percentage}%)</p>
          </div>
        `;
      }
    } catch(e) {
      console.error("Scoring error:", e);
    }
  }
};