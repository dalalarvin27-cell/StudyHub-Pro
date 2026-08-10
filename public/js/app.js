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
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" style="width:36px; height:36px; border-radius:50%;">
          <span style="font-weight:700;">${user.name}</span>
          <button onclick="logout()" class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;">Logout</button>
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
  window.location.href = "login.html";
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