/**
 * EduVault Mock Test Frontend Engine
 * Supports Custom Timer (5m, 15m, 30m, 60m, 120m & custom typed minutes)
 */

let timerInterval = null;
let currentSecondsLeft = 0;
let isTestSubmitted = false;

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

window.generateAndLaunchCustomTest = async function(formData) {
  try {
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
 * Format Time (Supports HH:MM:SS for long custom timers)
 */
function formatTimeDisplay(totalSecs) {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Initialize Test Timer
 */
window.initTestTimer = function(durationInMins) {
  const duration = parseInt(durationInMins, 10) || 10;
  currentSecondsLeft = duration * 60;
  isTestSubmitted = false;

  const timerDisplay = document.getElementById("timerDisplay");
  if (timerInterval) clearInterval(timerInterval);

  if (timerDisplay) {
    timerDisplay.innerText = formatTimeDisplay(currentSecondsLeft);
  }

  timerInterval = setInterval(() => {
    if (isTestSubmitted) return;

    if (currentSecondsLeft <= 0) {
      clearInterval(timerInterval);
      if (timerDisplay) timerDisplay.innerText = "00:00";
      window.autoSubmitMockTest();
    } else {
      currentSecondsLeft--;
      if (timerDisplay) {
        timerDisplay.innerText = formatTimeDisplay(currentSecondsLeft);
      }
    }
  }, 1000);
};

window.autoSubmitMockTest = function() {
  alert("⏰ Time is up! Your test is being submitted automatically.");
  window.processMockTestSubmission();
};

window.manualSubmitMockTest = function() {
  const confirmed = window.confirm("Are you sure you want to submit the test?");
  if (confirmed) {
    if (timerInterval) clearInterval(timerInterval);
    window.processMockTestSubmission();
  }
};

window.processMockTestSubmission = function() {
  isTestSubmitted = true;

  const inputs = document.querySelectorAll('input[type="radio"]');
  inputs.forEach(i => i.disabled = true);

  const submitBtn = document.getElementById("manualSubmitBtn");
  if (submitBtn) submitBtn.style.display = "none";

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