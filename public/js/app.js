// EduVault Global Application Engine

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  checkAuth();
  initGlobalSearch();
});

function initTheme() {
  const isDark = localStorage.getItem("eduvault_theme") === "dark";
  if (isDark) document.body.classList.add("dark-mode");
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("eduvault_theme", isDark ? "dark" : "light");
}

function checkAuth() {
  const token = localStorage.getItem("eduvault_token");
  const user = JSON.parse(localStorage.getItem("eduvault_user") || "null");
  const authContainer = document.getElementById("authContainer");

  if (authContainer) {
    if (user && token) {
      authContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(user.name)}" style="width:34px; height:34px; border-radius:50%; border:2px solid #4f46e5; object-fit:cover;">
          <span style="font-weight:700; font-size:0.85rem; color:var(--text-main);">${user.name.split(" ")[0]}</span>
          <button onclick="logout()" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; border-radius:20px; background:#fff;"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      `;
    } else {
      authContainer.innerHTML = `
        <a href="login.html" class="btn btn-outline">Log In</a>
        <a href="signup.html" class="btn btn-primary">Sign Up</a>
      `;
    }
  }
}

function logout() {
  localStorage.removeItem("eduvault_token");
  localStorage.removeItem("eduvault_user");
  localStorage.removeItem("studyhub_user");
  window.location.href = "login.html";
}

// SAFE FETCH JSON HELPER (PREVENTS UNEXPECTED TOKEN '<' HTML ERRORS PERMANENTLY)
async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Server error (${res.status})`);
      }
      return data;
    } else {
      const text = await res.text();
      console.error("[SAFE FETCH ERROR] Server returned HTML page instead of JSON:", text.substring(0, 150));
      throw new Error(`API endpoint returned non-JSON response (${res.status}). Please check API URL.`);
    }
  } catch (err) {
    console.error("[SAFE FETCH EXCEPTION]:", err.message);
    throw err;
  }
}

function initGlobalSearch() {
  const searchInput = document.getElementById("globalSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;

    document.querySelectorAll(".searchable-card").forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? "block" : "none";
    });
  });
}

function quickSearch(term) {
  const input = document.getElementById("globalSearchInput");
  if (input) {
    input.value = term;
    input.dispatchEvent(new Event("input"));
    document.getElementById("searchResultsSection")?.scrollIntoView({ behavior: "smooth" });
  }
}
