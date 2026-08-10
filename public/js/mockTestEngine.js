let currentTest = null;
let currentQuestions = [];
let userAnswers = {}; // { questionId: { optionIndex, isMarked, timeSpent } }
let currentQIndex = 0;
let timerInterval = null;
let secondsRemaining = 0;

async function loadMockTests(category = "ALL") {
  const grid = document.getElementById("mockTestsGrid");
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1; text-align:center;">Loading mock tests...</div>`;

  try {
    const url = category === "ALL" ? "/api/mock-tests" : `/api/mock-tests?category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.tests && data.tests.length > 0) {
      grid.innerHTML = data.tests.map(test => `
        <div class="glass-card searchable-card">
          <span style="background:var(--primary-light); color:var(--primary); font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:6px;">${test.category}</span>
          <h3 style="margin:12px 0 8px;">${test.title}</h3>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:16px;">${test.description || 'Comprehensive practice test for toppers.'}</p>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
            <span><i class="fa-solid fa-file-circle-question"></i> ${test.totalQuestions} Questions</span>
            <span><i class="fa-regular fa-clock"></i> ${test.durationMinutes} Mins</span>
            <span><i class="fa-solid fa-award"></i> ${test.totalMarks} Marks</span>
          </div>
          <button onclick="startTest('${test._id}')" class="btn btn-primary" style="width:100%;">Start Test Now</button>
        </div>
      `).join("");
    } else {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px;">No tests found.</div>`;
    }
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--danger);">Failed to load mock tests.</div>`;
  }
}

async function startTest(testId) {
  const token = localStorage.getItem("eduvault_token");
  if (!token) {
    alert("Please log in to start a mock test.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`/api/mock-tests/${testId}/start`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    currentTest = data.test;
    currentQuestions = data.questions;
    currentQIndex = 0;
    userAnswers = {};
    secondsRemaining = currentTest.durationMinutes * 60;

    document.getElementById("testTitle").innerText = currentTest.title;
    document.getElementById("testOverlay").style.display = "flex";

    renderQuestion();
    renderPalette();
    startTimer();
  } catch (err) {
    alert(err.message || "Failed to start test.");
  }
}

function renderQuestion() {
  const q = currentQuestions[currentQIndex];
  if (!q) return;

  document.getElementById("testProgress").innerText = `Question ${currentQIndex + 1} of ${currentQuestions.length}`;
  document.getElementById("qText").innerText = `${currentQIndex + 1}. ${q.questionText}`;

  const optionsContainer = document.getElementById("qOptions");
  const selectedAns = userAnswers[q._id]?.optionIndex;

  optionsContainer.innerHTML = q.options.map((opt, idx) => `
    <label style="display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:10px; border:1px solid var(--border-color); background:${selectedAns === idx ? 'var(--primary-light)' : 'var(--bg-glass)'}; cursor:pointer;">
      <input type="radio" name="optChoice" value="${idx}" ${selectedAns === idx ? 'checked' : ''} onchange="selectOption(${idx})">
      <span>${opt}</span>
    </label>
  `).join("");
}

function selectOption(idx) {
  const q = currentQuestions[currentQIndex];
  if (!userAnswers[q._id]) userAnswers[q._id] = {};
  userAnswers[q._id].optionIndex = idx;
  renderPalette();
}

function markForReview() {
  const q = currentQuestions[currentQIndex];
  if (!userAnswers[q._id]) userAnswers[q._id] = {};
  userAnswers[q._id].isMarked = !userAnswers[q._id].isMarked;
  renderPalette();
  saveAndNext();
}

function clearAnswer() {
  const q = currentQuestions[currentQIndex];
  if (userAnswers[q._id]) delete userAnswers[q._id].optionIndex;
  renderQuestion();
  renderPalette();
}

function saveAndNext() {
  if (currentQIndex < currentQuestions.length - 1) {
    currentQIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentQIndex > 0) {
    currentQIndex--;
    renderQuestion();
  }
}

function renderPalette() {
  const grid = document.getElementById("paletteGrid");
  grid.innerHTML = currentQuestions.map((q, idx) => {
    const ans = userAnswers[q._id];
    let statusClass = "not-visited";
    if (ans) {
      if (ans.isMarked) statusClass = "marked";
      else if (ans.optionIndex !== undefined) statusClass = "answered";
      else statusClass = "not-answered";
    }
    return `<button class="palette-btn ${statusClass}" onclick="jumpToQ(${idx})">${idx + 1}</button>`;
  }).join("");
}

function jumpToQ(idx) {
  currentQIndex = idx;
  renderQuestion();
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsRemaining--;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    document.getElementById("timerDisplay").innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      submitTest();
    }
  }, 1000);
}

function confirmSubmitTest() {
  if (confirm("Are you sure you want to submit your mock test?")) {
    submitTest();
  }
}

async function submitTest() {
  clearInterval(timerInterval);
  const token = localStorage.getItem("eduvault_token");

  const formattedAnswers = currentQuestions.map(q => ({
    questionId: q._id,
    userAnswer: userAnswers[q._id]?.optionIndex ?? null,
    timeSpentSeconds: 15
  }));

  try {
    const res = await fetch(`/api/attempts/${currentTest.id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        answers: formattedAnswers,
        timeTakenSeconds: (currentTest.durationMinutes * 60) - secondsRemaining
      })
    });

    const data = await res.json();
    document.getElementById("testOverlay").style.display = "none";
    alert(`Test Submitted! Score: ${data.results.score}/${data.results.totalMarks} (${data.results.percentage}%)`);
    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Submission error: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => loadMockTests());