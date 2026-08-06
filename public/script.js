// ==========================================================================
// STUDYHUB PRO - FULL ENGINE + ADMIN UPLOAD SYSTEM
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initAuthSystem();
    initNotesRendering();
    initLiveSearch();
    initCategoryFilter();
    initNoteModal();
    initDownloadSystem();
    initAdminPanel();
});

/* -------------------------------------------------------------------------
   1. USER AUTHENTICATION SYSTEM
   ------------------------------------------------------------------------- */
function initAuthSystem() {
    const user = JSON.parse(localStorage.getItem("studyhub_user"));
    const authButtons = document.querySelector(".auth-buttons");

    if (authButtons && user) {
        authButtons.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.name}" 
                     alt="User" style="width:36px; height:36px; border-radius:50%; border:2px solid var(--primary);">
                <span style="font-weight:600; font-size:0.9rem;">${user.name}</span>
                <button id="logoutBtn" class="btn btn-outline" style="padding: 6px 12px; font-size:0.8rem;">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        `;

        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            localStorage.removeItem("studyhub_user");
            alert("Logged out successfully!");
            window.location.reload();
        });
    }

    const googleBtns = document.querySelectorAll(".btn-social");
    googleBtns.forEach((btn) => {
        if (btn.innerText.includes("Google")) {
            btn.addEventListener("click", handleGoogleLogin);
        }
    });
}

function handleGoogleLogin() {
    const userName = prompt("Google Sign-In:\nEnter your name:", "Arvin Kumar");
    if (userName) {
        const dummyUser = {
            name: userName,
            email: userName.toLowerCase().replace(/\s+/g, '') + "@gmail.com",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
        };
        localStorage.setItem("studyhub_user", JSON.stringify(dummyUser));
        alert(`Welcome, ${userName}!`);
        window.location.href = "index.html";
    }
}


/* -------------------------------------------------------------------------
   2. DYNAMIC NOTES RENDERING (READ FROM ADMIN UPLOADS)
   ------------------------------------------------------------------------- */
function getCustomNotes() {
    return JSON.parse(localStorage.getItem("studyhub_custom_notes")) || [];
}

function initNotesRendering() {
    const notesGrid = document.querySelector(".notes-grid");
    if (!notesGrid) return;

    const customNotes = getCustomNotes();

    // Render Admin Custom Uploaded Notes First
    customNotes.forEach((note) => {
        const cardHTML = `
            <div class="note-card featured" data-id="${note.id}">
                <div class="featured-badge" style="background:#10b981;"><i class="fa-solid fa-circle-check"></i> Admin Verified</div>
                <div class="note-tag">${note.category}</div>
                <h3>${note.title}</h3>
                <p>${note.desc}</p>
                <div class="note-meta">
                    <span><i class="fa-solid fa-download"></i> 1.2k downloads</span>
                    <span class="rating"><i class="fa-solid fa-star"></i> 5.0</span>
                </div>
                <div class="note-actions">
                    <button class="btn btn-secondary"><i class="fa-solid fa-eye"></i> Preview</button>
                    <button class="btn btn-primary" data-link="${note.link}"><i class="fa-solid fa-file-arrow-down"></i> Download</button>
                </div>
            </div>
        `;
        notesGrid.insertAdjacentHTML("afterbegin", cardHTML);
    });
}


/* -------------------------------------------------------------------------
   3. ADMIN PANEL UPLOAD & MANAGEMENT LOGIC
   ------------------------------------------------------------------------- */
function initAdminPanel() {
    const uploadForm = document.getElementById("adminUploadForm");
    const adminNotesList = document.getElementById("adminNotesList");

    if (!uploadForm) return;

    // Render Uploaded List in Admin Panel
    function renderAdminList() {
        const customNotes = getCustomNotes();
        if (customNotes.length === 0) {
            adminNotesList.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No custom notes uploaded yet.</p>`;
            return;
        }

        adminNotesList.innerHTML = customNotes.map(note => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color);">
                <div>
                    <h4 style="font-size:0.95rem; color:var(--secondary);">${note.title}</h4>
                    <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">${note.category}</span>
                </div>
                <button onclick="deleteNote(${note.id})" style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `).join("");
    }

    renderAdminList();

    // Handle Note Upload Form Submit
    uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const newNote = {
            id: Date.now(),
            title: document.getElementById("noteTitle").value,
            category: document.getElementById("noteCategory").value,
            desc: document.getElementById("noteDesc").value,
            link: document.getElementById("noteLink").value
        };

        const currentNotes = getCustomNotes();
        currentNotes.unshift(newNote);
        localStorage.setItem("studyhub_custom_notes", JSON.stringify(currentNotes));

        alert("🎉 Note Successfully Uploaded & Published Live!");
        uploadForm.reset();
        renderAdminList();
    });
}

// Global Delete Function for Admin
window.deleteNote = function(id) {
    if (confirm("Kya aap is note ko delete karna chahte hain?")) {
        let customNotes = getCustomNotes();
        customNotes = customNotes.filter(note => note.id !== id);
        localStorage.setItem("studyhub_custom_notes", JSON.stringify(customNotes));
        window.location.reload();
    }
};


/* -------------------------------------------------------------------------
   4. LIVE SEARCH SYSTEM
   ------------------------------------------------------------------------- */
function initLiveSearch() {
    const searchInput = document.querySelector(".search-box input");
    const searchBtn = document.querySelector(".search-btn");

    if (!searchInput) return;

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        const noteCards = document.querySelectorAll(".note-card");

        noteCards.forEach((card) => {
            const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
            const desc = card.querySelector("p")?.innerText.toLowerCase() || "";
            const tag = card.querySelector(".note-tag")?.innerText.toLowerCase() || "";

            if (title.includes(query) || desc.includes(query) || tag.includes(query)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });

        if (query.length > 0) {
            document.getElementById("notes")?.scrollIntoView({ behavior: "smooth" });
        }
    }

    searchInput.addEventListener("keyup", performSearch);
    searchBtn?.addEventListener("click", performSearch);
}


/* -------------------------------------------------------------------------
   5. CATEGORY FILTER SYSTEM
   ------------------------------------------------------------------------- */
function initCategoryFilter() {
    const catCards = document.querySelectorAll(".category-card");

    catCards.forEach((card) => {
        card.addEventListener("click", (e) => {
            e.preventDefault();
            const catName = card.querySelector("h3")?.innerText.toLowerCase() || "";
            const noteCards = document.querySelectorAll(".note-card");

            noteCards.forEach((note) => {
                const tag = note.querySelector(".note-tag")?.innerText.toLowerCase() || "";
                if (tag.includes(catName) || (catName.includes("jee") && tag.includes("jee"))) {
                    note.style.display = "flex";
                } else {
                    note.style.display = "none";
                }
            });

            document.getElementById("notes")?.scrollIntoView({ behavior: "smooth" });
        });
    });
}


/* -------------------------------------------------------------------------
   6. NOTE PREVIEW MODAL
   ------------------------------------------------------------------------- */
function initNoteModal() {
    const modalHTML = `
        <div id="previewModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.7); backdrop-filter:blur(6px); z-index:2000; align-items:center; justify-content:center; padding:20px;">
            <div style="background:#fff; width:100%; max-width:650px; border-radius:16px; padding:30px; position:relative; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
                <button id="closeModal" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">&times;</button>
                <span id="modalTag" style="background:#eef2ff; color:#4f46e5; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.8rem;">Note Preview</span>
                <h2 id="modalTitle" style="margin:12px 0 8px; color:#0f172a;">Subject Name</h2>
                <p id="modalDesc" style="color:#64748b; font-size:0.95rem; margin-bottom:20px;">Description</p>
                
                <div style="background:#f8fafc; border:2px dashed #e2e8f0; height:200px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:24px; color:#64748b;">
                    <i class="fa-solid fa-file-pdf" style="font-size:3rem; color:#4f46e5; margin-bottom:10px;"></i>
                    <p style="font-weight:600;">PDF Document Verified & Ready</p>
                </div>

                <button id="modalDownloadBtn" class="btn btn-primary" style="width:100%; justify-content:center;">
                    <i class="fa-solid fa-download"></i> Download Full PDF
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("previewModal");
    const closeModal = document.getElementById("closeModal");

    document.addEventListener("click", (e) => {
        if (e.target.closest(".btn-secondary") && e.target.innerText.includes("Preview")) {
            const card = e.target.closest(".note-card");
            document.getElementById("modalTag").innerText = card.querySelector(".note-tag")?.innerText || "Notes";
            document.getElementById("modalTitle").innerText = card.querySelector("h3")?.innerText || "Preview";
            document.getElementById("modalDesc").innerText = card.querySelector("p")?.innerText || "";
            modal.style.display = "flex";
        }
    });

    closeModal?.addEventListener("click", () => modal.style.display = "none");
    modal?.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
}


/* -------------------------------------------------------------------------
   7. DOWNLOAD SYSTEM
   ------------------------------------------------------------------------- */
function initDownloadSystem() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-primary, #modalDownloadBtn");
        if (btn && btn.innerText.includes("Download")) {
            const user = JSON.parse(localStorage.getItem("studyhub_user"));
            if (!user) {
                if (confirm("Notes Download karne ke liye Login zaroori hai. Log in karein?")) {
                    window.location.href = "login.html";
                }
                return;
            }

            const cardTitle = btn.closest(".note-card")?.querySelector("h3")?.innerText || "Notes";
            const dummyContent = `StudyHub Pro - ${cardTitle}\nDownloaded by: ${user.name}`;
            
            const blob = new Blob([dummyContent], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${cardTitle.replace(/\s+/g, "_")}_Notes.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`✅ ${cardTitle} Download Complete!`);
        }
    });
}