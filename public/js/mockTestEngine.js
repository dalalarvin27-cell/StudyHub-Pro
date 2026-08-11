let currentTest = null;
let currentQuestions = [];
let userAnswers = {}; // { questionId: { optionIndex, isMarked, timeSpent } }
let currentQIndex = 0;
let timerInterval = null;
let secondsRemaining = 0;
let isTestSubmitted = false;

async function loadMockTests(category = "ALL") {
  const grid = document.getElementById("mockTestsGrid");
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px;">Loading mock tests...</div>`;

  try {
    const url = category === "ALL" ? "/api/mock-tests" : `/api/mock-tests?category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.tests && data.tests.length > 0) {
      grid.innerHTML = data.tests.map(test => `
        <div class="glass-card searchable-card">
          <span style="background:var(--primary-light); color:var(--primary); font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:6px;">${test.category}</span>
          <h3 style="margin:12px 0 8px;">${test.title}</h3>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:16px;">${test.description || 'Comprehensive practice test.'}</p>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
            <span><i class="fa-solid fa-file-circle-question"></i> ${test.totalQuestions} Questions</span>
            <span><i class="fa-regular fa-clock"></i> ${test.durationMinutes} Mins Timer</span>
            <span><i class="fa-solid fa-award"></i> ${test.totalMarks} Marks</span>
          </div>
          <button onclick="startTest('${test._id}')" class="btn btn-primary" style="width:100%;">Start Test Series</button>
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
    alert("Please log in to start the test series.");
    window.location.href = "login.html";
    return;
  }

  // Reset state for new test session
  isTestSubmitted = false;
  currentQIndex = 0;
  userAnswers = {};

  try {
    const res = await fetch(`/api/mock-tests/${testId}/start`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    currentTest = data.test;
    currentQuestions = data.questions;
    
    // Timer set to exact selected duration (e.g. 5, 10, or 15 minutes)
    secondsRemaining = (currentTest.durationMinutes || 10) * 60;

    document.getElementById("testTitle").innerText = `${currentTest.title} (${currentTest.difficulty || 'Standard'})`;
    document.getElementById("testOverlay").style.display = "flex";

    renderQuestion();
    renderPalette();
    startTimer();
  } catch (err) {
    alert(err.message || "Unable to start test.");
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
    <label style="display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:10px; border:1px solid var(--border-color); background:${selectedAns === idx ? 'var(--primary-light)' : 'var(--bg-glass)'}; cursor:${isTestSubmitted ? 'default' : 'pointer'}; transition:all 0.2s;">
      <input type="radio" name="optChoice" value="${idx}" ${selectedAns === idx ? 'checked' : ''} ${isTestSubmitted ? 'disabled' : ''} onchange="selectOption(${idx})">
      <span style="font-weight:600; font-size:0.95rem;">${opt}</span>
    </label>
  `).join("");
}

function selectOption(idx) {
  if (isTestSubmitted) return;
  const q = currentQuestions[currentQIndex];
  if (!userAnswers[q._id]) userAnswers[q._id] = {};
  userAnswers[q._id].optionIndex = idx;
  renderPalette();
}

function markForReview() {
  if (isTestSubmitted) return;
  const q = currentQuestions[currentQIndex];
  if (!userAnswers[q._id]) userAnswers[q._id] = {};
  userAnswers[q._id].isMarked = !userAnswers[q._id].isMarked;
  renderPalette();
  saveAndNext();
}

function clearAnswer() {
  if (isTestSubmitted) return;
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
  if (!grid) return;

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

/* COUNTDOWN TIMER LOGIC (WORKS ON MOBILE & DESKTOP) */
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (isTestSubmitted) {
      clearInterval(timerInterval);
      return;
    }

    secondsRemaining--;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    const timerElem = document.getElementById("timerDisplay");
    
    if (timerElem) {
      timerElem.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      if (timerElem) timerElem.innerText = "00:00";
      alert("⏱️ Time is Up! Submitting test series automatically.");
      submitTest();
    }
  }, 1000);
}

function confirmSubmitTest() {
  if (isTestSubmitted) return;
  if (confirm("Are you sure you want to submit the test?")) {
    submitTest();
  }
}

async function submitTest() {
  if (isTestSubmitted) return;
  isTestSubmitted = true;
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
        timeTakenSeconds: ((currentTest.durationMinutes || 10) * 60) - secondsRemaining
      })
    });

    const data = await res.json();
    document.getElementById("testOverlay").style.display = "none";
    
    // OPEN DETAILED RESULT & REVIEW MODAL
    showTestResultModal(data.attemptId, data.results);
  } catch (err) {
    alert("Submission error: " + err.message);
  }
}

/* DETAILED POST-TEST RESULT MODAL */
async function showTestResultModal(attemptId, results) {
  const token = localStorage.getItem("eduvault_token");
  let reviewData = [];
  
  try {
    const res = await fetch(`/api/attempts/${attemptId}/review`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    reviewData = data.reviewData || [];
  } catch(e) {}

  const existingModal = document.getElementById("testResultModal");
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div id="testResultModal" style="display:flex; position:fixed; inset:0; background:rgba(15,23,42,0.85); backdrop-filter:blur(12px); z-index:4000; align-items:center; justify-content:center; padding:20px; overflow-y:auto;">
      <div style="background:#ffffff; width:100%; max-width:800px; border-radius:24px; padding:32px; max-height:90vh; overflow-y:auto; box-shadow:0 25px 50px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.8);">
        
        <div style="text-align:center; margin-bottom:28px; border-bottom:1px solid #e2e8f0; padding-bottom:20px;">
          <span style="background:rgba(79,70,229,0.1); color:#4f46e5; padding:6px 16px; border-radius:30px; font-weight:700; font-size:0.85rem;">TEST PERFORMANCE ANALYTICS</span>
          <h2 style="font-size:2rem; color:#0f172a; margin-top:8px;">Test Result Summary 🎉</h2>
          
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:14px; margin-top:20px;">
            <div style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0;">
              <h3 style="font-size:1.5rem; color:#4f46e5; font-weight:800;">${results.score}/${results.totalMarks}</h3>
              <p style="font-size:0.8rem; color:#64748b; margin:0;">Total Score (${results.percentage}%)</p>
            </div>
            <div style="background:#f0fdf4; padding:14px; border-radius:12px; border:1px solid #bbf7d0;">
              <h3 style="font-size:1.5rem; color:#16a34a; font-weight:800;">✅ ${results.correctCount}</h3>
              <p style="font-size:0.8rem; color:#166534; margin:0;">Correct Answers</p>
            </div>
            <div style="background:#fef2f2; padding:14px; border-radius:12px; border:1px solid #fecaca;">
              <h3 style="font-size:1.5rem; color:#dc2626; font-weight:800;">❌ ${results.incorrectCount}</h3>
              <p style="font-size:0.8rem; color:#991b1b; margin:0;">Incorrect Answers</p>
            </div>
            <div style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0;">
              <h3 style="font-size:1.5rem; color:#d97706; font-weight:800;">⚪ ${results.unansweredCount}</h3>
              <p style="font-size:0.8rem; color:#64748b; margin:0;">Unanswered</p>
            </div>
          </div>
        </div>

        <h3 style="font-size:1.2rem; color:#0f172a; margin-bottom:16px;"><i class="fa-solid fa-list-check" style="color:#4f46e5;"></i> Detailed Answer Key & Explanations:</h3>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${reviewData.map((rev, idx) => {
            const statusBadge = rev.isCorrect 
              ? `<span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem;">✅ CORRECT</span>`
              : (rev.userAnswer === null 
                  ? `<span style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem;">⚪ UNANSWERED</span>`
                  : `<span style="background:#fee2e2; color:#b91c1c; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem;">❌ INCORRECT</span>`);

            return `
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <span style="font-weight:700; font-size:0.9rem; color:#4f46e5;">Q${idx + 1}.</span>
                  ${statusBadge}
                </div>
                
                <h4 style="font-size:0.95rem; color:#0f172a; margin-bottom:12px;">${rev.questionText}</h4>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                  ${rev.options.map((opt, oIdx) => {
                    let optStyle = "background:#ffffff; border:1px solid #cbd5e1; color:#334155;";
                    if (oIdx === rev.correctAnswer) {
                      optStyle = "background:#dcfce7; border:2px solid #22c55e; color:#15803d; font-weight:700;";
                    } else if (oIdx === rev.userAnswer && !rev.isCorrect) {
                      optStyle = "background:#fee2e2; border:2px solid #ef4444; color:#b91c1c; font-weight:700;";
                    }
                    return `
                      <div style="padding:10px 12px; border-radius:8px; font-size:0.85rem; ${optStyle}">
                        ${opt} ${oIdx === rev.correctAnswer ? ' (Correct Answer)' : ''} ${oIdx === rev.userAnswer && !rev.isCorrect ? ' (Your Choice)' : ''}
                      </div>
                    `;
                  }).join("")}
                </div>

                ${rev.explanation ? `
                  <div style="background:#eef2ff; border-left:4px solid #4f46e5; padding:10px 12px; border-radius:0 8px 8px 0; font-size:0.85rem; color:#334155;">
                    <strong>Explanation:</strong> ${rev.explanation}
                  </div>
                ` : ''}
              </div>
            `;
          }).join("")}
        </div>

        <div style="margin-top:28px; text-align:center;">
          <button onclick="document.getElementById('testResultModal').remove(); window.location.href='dashboard.html';" class="btn btn-primary" style="padding:12px 32px; font-size:1rem; border-radius:30px;">
            <i class="fa-solid fa-chart-pie"></i> Open Dashboard Analytics
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

document.addEventListener("DOMContentLoaded", () => loadMockTests());