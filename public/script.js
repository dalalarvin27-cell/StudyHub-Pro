// ==========================================================================
// STUDYHUB PRO - FULL ENGINE (NO-JUMP CLASS SUBJECT SELECTOR + ALL FEATURES)
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

/* -------------------------------------------------------------------------
   1. AUTHENTICATION & MOBILE GOOGLE LOGIN
   ------------------------------------------------------------------------- */
function initAuthSystem() {
    const user = JSON.parse(localStorage.getItem("studyhub_user"));
    const authButtons = document.querySelectorAll(".auth-buttons");

    authButtons.forEach(container => {
        if (user) {
            container.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.name}" 
                         alt="User" style="width:32px; height:34px; border-radius:50%; border:2px solid #4f46e5;">
                    <span style="font-weight:700; font-size:0.85rem; color:#0f172a;">${user.name.split(" ")[0]}</span>
                    <button onclick="handleLogout()" class="btn btn-outline" style="padding: 4px 10px; font-size:0.75rem;">Logout</button>
                </div>
            `;
        }
    });

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-social, .btn-primary");
        if (btn && (btn.innerText.includes("Google") || btn.innerText.includes("GitHub") || btn.innerText.includes("Sign In"))) {
            if (!user && e.target.closest("form") === null) {
                handleGoogleLogin();
            }
        }
    });
}

window.handleLogout = function() {
    localStorage.removeItem("studyhub_user");
    alert("Logged out successfully!");
    window.location.reload();
};

function handleGoogleLogin() {
    const existingModal = document.getElementById("googleAccountModal");
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="googleAccountModal" style="display:flex; position:fixed; inset:0; background:rgba(15,23,42,0.75); backdrop-filter:blur(8px); z-index:3000; align-items:flex-end; justify-content:center; padding:16px;">
            <div style="background:#ffffff; width:100%; max-width:440px; border-radius:24px 24px 16px 16px; padding:28px 24px; box-shadow:0 -10px 40px rgba(0,0,0,0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-brands fa-google" style="font-size:1.5rem; color:#4285F4;"></i>
                        <span style="font-weight:700; font-size:1.1rem; color:#0f172a;">Sign in with Google</span>
                    </div>
                    <button onclick="document.getElementById('googleAccountModal').remove()" style="background:none; border:none; font-size:1.5rem; color:#64748b; cursor:pointer;">&times;</button>
                </div>
                <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">Choose an account to continue to <strong>StudyHub Pro</strong></p>
                
                <div onclick="selectGoogleAccount('Arvin Kumar', 'arvin.student@gmail.com')" style="display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:10px; cursor:pointer; background:#f8fafc;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Arvin" style="width:40px; height:40px; border-radius:50%;">
                    <div>
                        <h4 style="font-size:0.95rem; color:#0f172a; margin:0; font-weight:700;">Arvin Kumar</h4>
                        <small style="color:#64748b;">arvin.student@gmail.com</small>
                    </div>
                </div>

                <div onclick="selectGoogleAccount('Priya Sharma', 'priya.study@gmail.com')" style="display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:16px; cursor:pointer; background:#f8fafc;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" style="width:40px; height:40px; border-radius:50%;">
                    <div>
                        <h4 style="font-size:0.95rem; color:#0f172a; margin:0; font-weight:700;">Priya Sharma</h4>
                        <small style="color:#64748b;">priya.study@gmail.com</small>
                    </div>
                </div>

                <div style="border-top:1px solid #e2e8f0; padding-top:16px; text-align:center;">
                    <button onclick="promptCustomAccount()" style="background:none; border:none; color:#4f46e5; font-weight:700; font-size:0.9rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-user-plus"></i> Use another email account
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

window.selectGoogleAccount = function(name, email) {
    const userObj = { name: name, email: email, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` };
    localStorage.setItem("studyhub_user", JSON.stringify(userObj));
    document.getElementById("googleAccountModal")?.remove();
    alert(`🎉 Signed in successfully as ${name}!`);
    window.location.href = "index.html";
};

window.promptCustomAccount = function() {
    const name = prompt("Enter your Full Name:");
    if (name) {
        const email = prompt("Enter your Email Address:") || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
        selectGoogleAccount(name, email);
    }
};

/* -------------------------------------------------------------------------
   2. DATA & RENDERING LOGIC
   ------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------
   3. INTERACTIVE CLASS -> SUBJECT SELECTOR (NO JUMP FIX)
   ------------------------------------------------------------------------- */
function initCategoryFilter() {
    document.querySelectorAll(".category-card").forEach((card) => {
        card.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const selectedClass = card.dataset.cat || card.querySelector("h3")?.innerText || "";
            openSubjectModal(selectedClass);
        });
    });
}

function openSubjectModal(className) {
    const existingModal = document.getElementById("subjectPickerModal");
    if (existingModal) existingModal.remove();

    const subjects = CLASS_SUBJECTS_MAP[className] || ["All Subjects"];

    const modalHTML = `
        <div id="subjectPickerModal" style="display:flex; position:fixed; inset:0; background:rgba(15,23,42,0.75); backdrop-filter:blur(10px); z-index:2500; align-items:center; justify-content:center; padding:20px;">
            <div style="background:#ffffff; width:100%; max-width:550px; border-radius:24px; padding:32px 28px; position:relative; box-shadow:0 25px 50px rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.8);">
                <button onclick="document.getElementById('subjectPickerModal').remove()" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.6rem; color:#64748b; cursor:pointer;">&times;</button>
                
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:40px; height:40px; background:rgba(79, 70, 229, 0.1); color:#4f46e5; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <h3 style="font-size:1.4rem; color:#0f172a; font-weight:800; margin:0;">${className} Subjects</h3>
                </div>
                <p style="color:#64748b; font-size:0.9rem; margin-bottom:24px;">Select a subject to view available handwritten notes:</p>

                <div style="display:flex; flex-wrap:wrap; gap:10px; max-height:280px; overflow-y:auto; padding-right:6px;">
                    <button onclick="filterNotesBySubject('${className}', 'ALL')" style="background:#4f46e5; color:#fff; border:none; padding:10px 18px; border-radius:30px; font-weight:700; font-size:0.88rem; cursor:pointer; box-shadow:0 4px 12px rgba(79,70,229,0.3);">
                        <i class="fa-solid fa-layer-group"></i> All ${className} Notes
                    </button>
                    ${subjects.map(subj => `
                        <button onclick="filterNotesBySubject('${className}', '${subj}')" style="background:#f8fafc; color:#1e293b; border:1px solid #e2e8f0; padding:10px 16px; border-radius:30px; font-weight:600; font-size:0.88rem; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#eef2ff'; this.style.borderColor='#4f46e5'; this.style.color='#4f46e5'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.color='#1e293b'">
                            <i class="fa-solid fa-book"></i> ${subj}
                        </button>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

window.filterNotesBySubject = function(className, subject) {
    document.getElementById("subjectPickerModal")?.remove();

    const noteCards = document.querySelectorAll(".note-card");
    let matchCount = 0;

    noteCards.forEach((card) => {
        const tag = card.querySelector(".note-tag")?.innerText.toLowerCase() || "";
        const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
        
        const matchesClass = tag.includes(className.toLowerCase());
        const matchesSubj = (subject === 'ALL') || tag.includes(subject.toLowerCase()) || title.includes(subject.toLowerCase());

        if (matchesClass && matchesSubj) {
            card.style.display = "flex";
            matchCount++;
        } else {
            card.style.display = "none";
        }
    });

    let noResultsMsg = document.getElementById("noResultsMsg");
    const notesGrid = document.querySelector(".notes-grid");

    if (matchCount === 0) {
        if (!noResultsMsg && notesGrid) {
            noResultsMsg = document.createElement("div");
            noResultsMsg.id = "noResultsMsg";
            noResultsMsg.style.cssText = "grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-weight: 600;";
            noResultsMsg.innerHTML = `<i class="fa-solid fa-folder-open" style="font-size:2.5rem; margin-bottom:12px; color:#4f46e5; display:block;"></i> Currently no uploaded notes found for ${className} ${subject === 'ALL' ? '' : '• ' + subject}. <br><span style="font-size:0.85rem; font-weight:400; color:#94a3b8;">Be the first to share notes using the Share Notes form below!</span>`;
            notesGrid.appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }

    document.getElementById("notes")?.scrollIntoView({ behavior: "smooth" });
};

/* -------------------------------------------------------------------------
   4. NO-JUMP REAL-TIME LIVE SEARCH
   ------------------------------------------------------------------------- */
function initLiveSearch() {
    const searchInput = document.querySelector(".search-box input");
    const searchBtn = document.querySelector(".search-btn");

    if (!searchInput) return;

    function performSearch(shouldScroll = false) {
        const query = searchInput.value.toLowerCase().trim();
        const noteCards = document.querySelectorAll(".note-card");
        let matchCount = 0;

        noteCards.forEach((card) => {
            const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
            const desc = card.querySelector("p")?.innerText.toLowerCase() || "";
            const tag = card.querySelector(".note-tag")?.innerText.toLowerCase() || "";

            if (query === "" || title.includes(query) || desc.includes(query) || tag.includes(query)) {
                card.style.display = "flex";
                matchCount++;
            } else {
                card.style.display = "none";
            }
        });

        let noResultsMsg = document.getElementById("noResultsMsg");
        const notesGrid = document.querySelector(".notes-grid");

        if (matchCount === 0 && query !== "") {
            if (!noResultsMsg && notesGrid) {
                noResultsMsg = document.createElement("div");
                noResultsMsg.id = "noResultsMsg";
                noResultsMsg.style.cssText = "grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-weight: 600;";
                noResultsMsg.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="font-size:2rem; margin-bottom:10px; color:#4f46e5; display:block;"></i> No notes found matching "${query}". Try searching Physics, Class 12, or Calculus.`;
                notesGrid.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }

        if (shouldScroll && query !== "") {
            document.getElementById("notes")?.scrollIntoView({ behavior: "smooth" });
        }
    }

    searchInput.addEventListener("input", () => performSearch(false));
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch(true);
        }
    });

    searchBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        performSearch(true);
    });
}

/* -------------------------------------------------------------------------
   5. STUDENT FORMS, ADMIN PANEL, MODAL & DOWNLOAD LOGS
   ------------------------------------------------------------------------- */
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

        if (adminDownloadLogsList) {
            adminDownloadLogsList.innerHTML = downloadLogs.length === 0 ? '<p style="color:#64748b; font-size:0.85rem;">No download activities logged yet.</p>' :
                downloadLogs.slice(0, 15).map(log => `
                    <div style="display:flex; flex-direction:column; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong style="font-size:0.85rem; color:#0f172a;"><i class="fa-solid fa-circle-user" style="color:#4f46e5;"></i> ${log.userName} (${log.userEmail})</strong>
                            <small style="color:#64748b; font-size:0.75rem;">${log.time}</small>
                        </div>
                        <div style="font-size:0.82rem; color:#1e293b; margin-top:2px;">
                            Downloaded: <span style="font-weight:700; color:#4f46e5;">${log.noteTitle}</span> <small>(${log.category})</small>
                        </div>
                    </div>
                `).join("");
        }

        if (adminFeedbackList) {
            adminFeedbackList.innerHTML = feedbacks.length === 0 ? '<p style="color:#64748b; font-size:0.85rem;">No student feedbacks yet.</p>' :
                feedbacks.map(fb => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
                        <div>
                            <strong style="font-size:0.9rem;">${fb.name} (${fb.role}) - ${fb.rating}★</strong>
                            <p style="font-size:0.8rem; color:#64748b; margin:0;">"${fb.message}"</p>
                        </div>
                        <button onclick="deleteFeedback(${fb.id})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `).join("");
        }

        if (adminNotesList) {
            adminNotesList.innerHTML = customNotes.length === 0 ? '<p style="color:#64748b; font-size:0.85rem;">No custom notes live.</p>' :
                customNotes.map(note => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
                        <div>
                            <strong style="font-size:0.9rem;">${note.title}</strong><br>
                            <small style="color:#4f46e5; font-weight:600;">${note.category}</small>
                        </div>
                        <button onclick="deleteNote(${note.id})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                `).join("");
        }

        if (adminPendingList) {
            adminPendingList.innerHTML = pendingNotes.length === 0 ? '<p style="color:#64748b; font-size:0.85rem;">No pending student submissions.</p>' :
                pendingNotes.map(note => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px;">
                        <div>
                            <strong style="font-size:0.9rem;">${note.title}</strong> (By: ${note.studentName})<br>
                            <small style="color:#4f46e5; font-weight:600;">${note.category}</small>
                            <p style="font-size:0.8rem; color:#64748b; margin:0;">${note.desc}</p>
                        </div>
                        <div>
                            <button onclick="approveNote(${note.id})" style="background:#10b981; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:4px;"><i class="fa-solid fa-check"></i> Approve</button>
                            <button onclick="deletePendingNote(${note.id})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `).join("");
        }
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

function initDownloadSystem() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-primary, #modalDownloadBtn");
        if (btn && btn.innerText.includes("Download")) {
            const card = btn.closest(".note-card");
            const cardTitle = card?.querySelector("h3")?.innerText || document.getElementById("modalTitle")?.innerText || "Notes";
            const category = card?.querySelector(".note-tag")?.innerText || document.getElementById("modalTag")?.innerText || "General";
            
            const user = JSON.parse(localStorage.getItem("studyhub_user"));

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