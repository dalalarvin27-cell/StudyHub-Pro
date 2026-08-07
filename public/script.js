// ==========================================================================
// STUDYHUB PRO - FULL SECURITY & ANALYTICS ENGINE
// ==========================================================================

const CLASS_SUBJECTS_MAP = {
    "Class 9": ["Mathematics", "Physics", "Chemistry", "Biology", "Social Science (SST)", "English", "Hindi"],
    "Class 10": ["Mathematics", "Physics", "Chemistry", "Biology", "Social Science (SST)", "English", "Hindi", "Computer Applications"],
    "Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science / IP", "Economics", "Accountancy", "Business Studies", "English"],
    "Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science / IP", "Economics", "Accountancy", "Business Studies", "English"],
    "JEE": ["Physics", "Chemistry", "Mathematics"],
    "NEET": ["Physics", "Chemistry", "Biology (Botany)", "Biology (Zoology)"],
    "B.Tech": ["Database Management Systems (DBMS)", "Data Structures & Algorithms (DSA)", "Operating Systems (OS)", "Computer Networks (CN)", "Software Engineering", "Engineering Mathematics"],
    "UPSC": ["Indian Polity", "History (Ancient/Modern)", "Geography", "Indian Economy", "General Science", "Current Affairs"]
};

const DEFAULT_NOTES = [
    { id: 1, title: "Electrostatics Complete Notes", category: "Class 12 • Physics", desc: "Formula sheets, solved numericals, and chapter summary by top educators.", downloads: "14.2k", rating: "4.9" },
    { id: 2, title: "Complete Calculus Revision", category: "JEE • Mathematics", desc: "Limits, Derivatives, Integrals & Differential equations with PYQ shortcuts.", downloads: "28.5k", rating: "5.0" },
    { id: 3, title: "DBMS & SQL Handcrafted Notes", category: "B.Tech • Computer Science", desc: "Normalization, ER diagrams, SQL queries & Interview questions.", downloads: "9.8k", rating: "4.8" }
];

const DEFAULT_FEEDBACKS = [
    { id: 101, name: "Aman Verma", role: "Class 12 Student", rating: "5", message: "StudyHub Pro helped me score 95% in my Physics board exam! Formula sheets were super clean." },
    { id: 102, name: "Priya Sharma", role: "JEE Aspirant", rating: "5", message: "Calculus notes and PYQs saved my revision time for JEE Mains. Highly recommended!" }
];

document.addEventListener("DOMContentLoaded", () => {
    initAuthSystem();
    initNotesRendering();
    initFeedbacksRendering();
    initStudentShareForm();
    initLiveSearch();
    initCategoryFilter();
    initNoteModal();
    initDownloadSystem();
    initAdminPanel();
});

function initAuthSystem() {
    const user = JSON.parse(localStorage.getItem("studyhub_user"));
    const authButtons = document.querySelector(".auth-buttons");
    if (authButtons && user) {
        authButtons.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.name}" 
                     alt="User" style="width:36px; height:36px; border-radius:50%; border:2px solid var(--primary);">
                <span style="font-weight:600; font-size:0.9rem;">${user.name}</span>
                <button id="logoutBtn" class="btn btn-outline" style="padding: 6px 12px; font-size:0.8rem;">Logout</button>
            </div>
        `;
        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            localStorage.removeItem("studyhub_user");
            window.location.reload();
        });
    }
}

function getCustomNotes() { return JSON.parse(localStorage.getItem("studyhub_custom_notes")) || []; }
function getPendingNotes() { return JSON.parse(localStorage.getItem("studyhub_pending_notes")) || []; }
function getFeedbacks() { const stored = JSON.parse(localStorage.getItem("studyhub_feedbacks")); return stored ? stored : DEFAULT_FEEDBACKS; }
function getDownloadLogs() { return JSON.parse(localStorage.getItem("studyhub_download_logs")) || []; }

function initNotesRendering() {
    const notesGrid = document.querySelector(".notes-grid");
    if (!notesGrid) return;

    const customNotes = getCustomNotes();
    const allNotes = [...customNotes, ...DEFAULT_NOTES];

    notesGrid.innerHTML = allNotes.map(note => `
        <div class="note-card ${note.rating === '5.0' ? 'featured' : ''}">
            ${note.rating === '5.0' ? '<div class="featured-badge"><i class="fa-solid fa-fire"></i> Top Rated</div>' : ''}
            <div class="note-tag">${note.category}</div>
            <h3>${note.title}</h3>
            <p>${note.desc}</p>
            <div class="note-meta">
                <span><i class="fa-solid fa-download"></i> ${note.downloads || '1.5k'} downloads</span>
                <span class="rating"><i class="fa-solid fa-star"></i> ${note.rating || '4.9'}</span>
            </div>
            <div class="note-actions">
                <button class="btn btn-secondary"><i class="fa-solid fa-eye"></i> Preview</button>
                <button class="btn btn-primary"><i class="fa-solid fa-file-arrow-down"></i> Download</button>
            </div>
        </div>
    `).join("");
}

/* 1. STUDENT SHARE FORM */
function initStudentShareForm() {
    const shareForm = document.getElementById("publicShareForm");
    if (!shareForm) return;

    shareForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newSubmission = {
            id: Date.now(),
            studentName: document.getElementById("studentName").value,
            title: document.getElementById("shareTitle").value,
            category: document.getElementById("studentClass").value,
            desc: document.getElementById("shareDesc").value,
            link: document.getElementById("shareLink").value
        };

        const pending = getPendingNotes();
        pending.unshift(newSubmission);
        localStorage.setItem("studyhub_pending_notes", JSON.stringify(pending));

        alert("🎉 Thank you! Your notes have been submitted for Admin Verification!");
        shareForm.reset();
    });
}

/* 2. FEEDBACK SYSTEM */
function initFeedbacksRendering() {
    const feedbackGrid = document.getElementById("feedbackGrid");
    const fbForm = document.getElementById("publicFeedbackForm");

    if (feedbackGrid) {
        const feedbacks = getFeedbacks();
        feedbackGrid.innerHTML = feedbacks.map(fb => `
            <div class="feedback-card">
                <h4>${fb.name} <span class="fb-role">${fb.role}</span></h4>
                <div class="fb-stars">${'⭐'.repeat(parseInt(fb.rating))} (${fb.rating}/5)</div>
                <p>"${fb.message}"</p>
            </div>
        `).join("");
    }

    if (fbForm) {
        fbForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newFb = {
                id: Date.now(),
                name: document.getElementById("fbName").value,
                role: document.getElementById("fbClass").value,
                rating: document.getElementById("fbRating").value,
                message: document.getElementById("fbMessage").value
            };

            const feedbacks = getFeedbacks();
            feedbacks.unshift(newFb);
            localStorage.setItem("studyhub_feedbacks", JSON.stringify(feedbacks));

            alert("🎉 Thank you! Your review has been published live!");
            fbForm.reset();
            initFeedbacksRendering();
        });
    }
}

/* 3. ADMIN PANEL LOGIC */
window.updateAdminSubjects = function() {
    const classSelect = document.getElementById("noteClass");
    const subjectSelect = document.getElementById("noteSubject");
    if (!classSelect || !subjectSelect) return;

    const subjects = CLASS_SUBJECTS_MAP[classSelect.value] || [];
    subjectSelect.innerHTML = subjects.map(subj => `<option value="${subj}">${subj}</option>`).join("");
};

function initAdminPanel() {
    const uploadForm = document.getElementById("adminUploadForm");
    const adminNotesList = document.getElementById("adminNotesList");
    const adminPendingList = document.getElementById("adminPendingList");
    const adminFeedbackList = document.getElementById("adminFeedbackList");
    const adminDownloadLogsList = document.getElementById("adminDownloadLogsList");

    if (!uploadForm) return;
    updateAdminSubjects();

    function renderAdminLists() {
        const customNotes = getCustomNotes();
        const pendingNotes = getPendingNotes();
        const feedbacks = getFeedbacks();
        const downloadLogs = getDownloadLogs();

        // Download Logs
        adminDownloadLogsList.innerHTML = downloadLogs.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No download activities logged yet.</p>' :
            downloadLogs.slice(0, 15).map(log => `
                <div class="list-item" style="flex-direction:column; align-items:flex-start; gap:4px;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <strong style="color:var(--secondary); font-size:0.85rem;"><i class="fa-solid fa-circle-user" style="color:var(--primary);"></i> ${log.userName} (${log.userEmail})</strong>
                        <small style="color:var(--text-muted); font-size:0.75rem;">${log.time}</small>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-main);">
                        Downloaded: <span style="font-weight:700; color:var(--primary);">${log.noteTitle}</span> <small>(${log.category})</small>
                    </div>
                </div>
            `).join("");

        // Feedbacks List
        adminFeedbackList.innerHTML = feedbacks.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No student feedbacks yet.</p>' :
            feedbacks.map(fb => `
                <div class="list-item">
                    <div>
                        <strong>${fb.name} (${fb.role}) - ${fb.rating}★</strong>
                        <p style="font-size:0.8rem; color:var(--text-muted);">"${fb.message}"</p>
                    </div>
                    <button onclick="deleteFeedback(${fb.id})" class="btn-del"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join("");

        // Live Notes
        adminNotesList.innerHTML = customNotes.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No custom notes live.</p>' :
            customNotes.map(note => `
                <div class="list-item">
                    <div>
                        <strong>${note.title}</strong><br>
                        <small style="color:var(--primary); font-weight:600;">${note.category}</small>
                    </div>
                    <button onclick="deleteNote(${note.id})" class="btn-del"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            `).join("");

        // Pending Submissions
        adminPendingList.innerHTML = pendingNotes.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No pending student submissions.</p>' :
            pendingNotes.map(note => `
                <div class="list-item">
                    <div>
                        <strong>${note.title}</strong> (By: ${note.studentName})<br>
                        <small style="color:var(--primary); font-weight:600;">${note.category}</small>
                        <p style="font-size:0.8rem; color:var(--text-muted);">${note.desc}</p>
                    </div>
                    <div>
                        <button onclick="approveNote(${note.id})" class="btn-approve"><i class="fa-solid fa-check"></i> Approve</button>
                        <button onclick="deletePendingNote(${note.id})" class="btn-del"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            `).join("");
    }

    renderAdminLists();

    uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const noteClass = document.getElementById("noteClass").value;
        const noteSubject = document.getElementById("noteSubject").value;

        const newNote = {
            id: Date.now(),
            title: document.getElementById("noteTitle").value,
            category: `${noteClass} • ${noteSubject}`,
            desc: document.getElementById("noteDesc").value,
            link: document.getElementById("noteLink").value,
            downloads: "1.0k",
            rating: "5.0"
        };

        const currentNotes = getCustomNotes();
        currentNotes.unshift(newNote);
        localStorage.setItem("studyhub_custom_notes", JSON.stringify(currentNotes));

        alert("🎉 Note Published Live!");
        uploadForm.reset();
        renderAdminLists();
    });
}

window.approveNote = function(id) {
    let pending = getPendingNotes();
    const noteToApprove = pending.find(n => n.id === id);
    if (noteToApprove) {
        let customNotes = getCustomNotes();
        noteToApprove.downloads = "1.0k";
        noteToApprove.rating = "5.0";
        customNotes.unshift(noteToApprove);
        
        pending = pending.filter(n => n.id !== id);
        localStorage.setItem("studyhub_custom_notes", JSON.stringify(customNotes));
        localStorage.setItem("studyhub_pending_notes", JSON.stringify(pending));
        
        alert("✅ Student Note Approved & Published Live!");
        window.location.reload();
    }
};

window.deletePendingNote = function(id) {
    let pending = getPendingNotes().filter(n => n.id !== id);
    localStorage.setItem("studyhub_pending_notes", JSON.stringify(pending));
    window.location.reload();
};

window.deleteNote = function(id) {
    if (confirm("Delete this live note?")) {
        let customNotes = getCustomNotes().filter(note => note.id !== id);
        localStorage.setItem("studyhub_custom_notes", JSON.stringify(customNotes));
        window.location.reload();
    }
};

window.deleteFeedback = function(id) {
    if (confirm("Delete this review?")) {
        let feedbacks = getFeedbacks().filter(fb => fb.id !== id);
        localStorage.setItem("studyhub_feedbacks", JSON.stringify(feedbacks));
        window.location.reload();
    }
};

window.clearDownloadLogs = function() {
    if (confirm("Clear all download activity logs?")) {
        localStorage.removeItem("studyhub_download_logs");
        window.location.reload();
    }
};

/* 4. DOWNLOAD LOGGING SYSTEM */
function initDownloadSystem() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-primary, #modalDownloadBtn");
        if (btn && btn.innerText.includes("Download")) {
            const card = btn.closest(".note-card");
            const cardTitle = card?.querySelector("h3")?.innerText || document.getElementById("modalTitle")?.innerText || "Notes";
            const category = card?.querySelector(".note-tag")?.innerText || document.getElementById("modalTag")?.innerText || "General";
            
            const user = JSON.parse(localStorage.getItem("studyhub_user"));

            // LOG DOWNLOAD ACTIVITY FOR ADMIN
            const logEntry = {
                id: Date.now(),
                userName: user ? user.name : "Guest Student",
                userEmail: user ? user.email : "Not Logged In",
                noteTitle: cardTitle,
                category: category,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
            };

            const downloadLogs = getDownloadLogs();
            downloadLogs.unshift(logEntry);
            localStorage.setItem("studyhub_download_logs", JSON.stringify(downloadLogs));

            // TRIGGER DOWNLOAD
            const dummyContent = `StudyHub Pro - ${cardTitle}\nDownloaded by: ${logEntry.userName}`;
            const blob = new Blob([dummyContent], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${cardTitle.replace(/\s+/g, "_")}_Notes.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`✅ ${cardTitle} Download Started!`);
        }
    });
}

/* 5. SEARCH, FILTER & MODAL */
function initLiveSearch() {
    const searchInput = document.querySelector(".search-box input");
    const searchBtn = document.querySelector(".search-btn");

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll(".note-card").forEach((card) => {
            const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
            const desc = card.querySelector("p")?.innerText.toLowerCase() || "";
            const tag = card.querySelector(".note-tag")?.innerText.toLowerCase() || "";

            card.style.display = (title.includes(query) || desc.includes(query) || tag.includes(query)) ? "flex" : "none";
        });
        if (query) document.getElementById("notes")?.scrollIntoView({ behavior: "smooth" });
    }

    searchInput?.addEventListener("keyup", performSearch);
    searchBtn?.addEventListener("click", performSearch);
}

function initCategoryFilter() {
    document.querySelectorAll(".category-card").forEach((card) => {
        card.addEventListener("click", (e) => {
            e.preventDefault();
            const catName = card.dataset.cat || card.querySelector("h3")?.innerText || "";
            
            document.querySelectorAll(".note-card").forEach((note) => {
                const tag = note.querySelector(".note-tag")?.innerText || "";
                note.style.display = tag.toLowerCase().includes(catName.toLowerCase()) ? "flex" : "none";
            });
            document.getElementById("notes")?.scrollIntoView({ behavior: "smooth" });
        });
    });
}

function initNoteModal() {
    const modalHTML = `
        <div id="previewModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.7); backdrop-filter:blur(6px); z-index:2000; align-items:center; justify-content:center; padding:20px;">
            <div style="background:#fff; width:100%; max-width:600px; border-radius:16px; padding:30px; position:relative;">
                <button id="closeModal" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <span id="modalTag" style="background:#eef2ff; color:#4f46e5; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem;">Note Preview</span>
                <h2 id="modalTitle" style="margin:12px 0 8px;">Title</h2>
                <p id="modalDesc" style="color:#64748b; font-size:0.9rem; margin-bottom:20px;">Desc</p>
                <div style="background:#f8fafc; border:2px dashed #e2e8f0; height:180px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:20px;">
                    <i class="fa-solid fa-file-pdf" style="font-size:3rem; color:#4f46e5; margin-bottom:10px;"></i>
                    <p style="font-weight:600;">PDF Document Ready for Download</p>
                </div>
                <button id="modalDownloadBtn" class="btn btn-primary" style="width:100%; justify-content:center;"><i class="fa-solid fa-download"></i> Download Full PDF</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("previewModal");
    document.addEventListener("click", (e) => {
        if (e.target.closest(".btn-secondary") && e.target.innerText.includes("Preview")) {
            const card = e.target.closest(".note-card");
            document.getElementById("modalTag").innerText = card.querySelector(".note-tag")?.innerText || "";
            document.getElementById("modalTitle").innerText = card.querySelector("h3")?.innerText || "";
            document.getElementById("modalDesc").innerText = card.querySelector("p")?.innerText || "";
            modal.style.display = "flex";
        }
    });

    document.getElementById("closeModal")?.addEventListener("click", () => modal.style.display = "none");
    modal?.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
}