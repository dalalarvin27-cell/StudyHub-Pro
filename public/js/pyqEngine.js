let currentPYQs = [];

async function filterPYQs() {
  const exam = document.getElementById("filterExam")?.value || "ALL";
  const year = document.getElementById("filterYear")?.value || "ALL";
  const subject = document.getElementById("filterSubject")?.value || "ALL";

  let url = "/api/pyq?";
  if (exam !== "ALL") url += `exam=${encodeURIComponent(exam)}&`;
  if (year !== "ALL") url += `year=${year}&`;
  if (subject !== "ALL") url += `subject=${encodeURIComponent(subject)}&`;

  const container = document.getElementById("pyqListContainer");
  if (!container) return;

  container.innerHTML = `<div style="text-align:center;">Loading PYQs...</div>`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    // Fallback practice PYQs if DB empty
    const pyqs = (data.pyqs && data.pyqs.length > 0) ? data.pyqs : [
      {
        _id: "sample_pyq_1",
        exam: "NDA",
        year: 2024,
        subject: "Mathematics",
        questionText: "What is the value of the determinant |1 2 3| |4 5 6| |7 8 9| ?",
        options: ["0", "1", "6", "12"],
        correctAnswer: 0,
        explanation: "Since rows 1, 2, 3 are in arithmetic progression, row 3 - row 2 = row 2 - row 1, making the determinant 0.",
        source: "NDA I 2024 Official Paper"
      },
      {
        _id: "sample_pyq_2",
        exam: "NDA",
        year: 2023,
        subject: "Physics",
        questionText: "A body moves in a circular path with constant speed. Its velocity vector is:",
        options: ["Constant", "Constantly changing direction", "Zero", "Parallel to radius"],
        correctAnswer: 1,
        explanation: "Uniform circular motion has constant speed, but direction changes at every point, making velocity vector constantly changing.",
        source: "NDA II 2023 Official Paper"
      }
    ];

    container.innerHTML = pyqs.map((q, idx) => `
      <div class="glass-card">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="background:var(--primary-light); color:var(--primary); font-weight:700; font-size:0.8rem; padding:4px 10px; border-radius:6px;">${q.exam} ${q.year} • ${q.subject}</span>
          <small style="color:var(--text-muted);">${q.source || 'Public Domain Paper'}</small>
        </div>

        <h4 style="font-size:1.05rem; margin-bottom:16px;">Q${idx + 1}. ${q.questionText}</h4>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
          ${q.options.map((opt, oIdx) => `
            <button onclick="checkPYQAnswer('${q._id}', ${oIdx}, ${q.correctAnswer})" class="btn btn-outline pyq-opt-${q._id}" style="text-align:left; font-size:0.9rem;">${opt}</button>
          `).join("")}
        </div>

        <div id="explanation-${q._id}" style="display:none; padding:12px; background:var(--primary-light); border-radius:8px; font-size:0.88rem; margin-top:12px;">
          <strong>Explanation:</strong> ${q.explanation}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <button onclick="bookmarkPYQ('${q._id}')" class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;"><i class="fa-regular fa-bookmark"></i> Bookmark</button>
          <button onclick="reportPYQ('${q._id}')" class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem; color:var(--danger);"><i class="fa-solid fa-flag"></i> Report</button>
        </div>
      </div>
    `).join("");
  } catch(err) {
    container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load PYQs.</div>`;
  }
}

function checkPYQAnswer(qId, selectedIdx, correctIdx) {
  const expDiv = document.getElementById(`explanation-${qId}`);
  if (expDiv) expDiv.style.display = "block";

  const buttons = document.querySelectorAll(`.pyq-opt-${qId}`);
  buttons.forEach((btn, idx) => {
    if (idx === correctIdx) {
      btn.style.background = "var(--success)";
      btn.style.color = "#fff";
    } else if (idx === selectedIdx && selectedIdx !== correctIdx) {
      btn.style.background = "var(--danger)";
      btn.style.color = "#fff";
    }
  });
}

async function bookmarkPYQ(qId) {
  const token = localStorage.getItem("eduvault_token");
  if (!token) return alert("Please log in to bookmark questions.");

  await fetch("/api/bookmarks/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ contentType: "PYQ", contentId: qId, title: "Bookmarked PYQ Question" })
  });
  alert("Question bookmarked!");
}

async function reportPYQ(qId) {
  await fetch(`/api/pyq/${qId}/report`, { method: "POST" });
  alert("Question reported to EduVault moderation team.");
}

document.addEventListener("DOMContentLoaded", filterPYQs);