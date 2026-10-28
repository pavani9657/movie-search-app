// ====== Demo authentication (stored only in this browser) ======
const USERS_KEY = "users";
const CURRENT_KEY = "currentUser";
const HOME_PAGE = "index.html";

const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const nameInput = document.getElementById("auth-name");
const nameGroup = document.getElementById("name-group");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const authSubmit = document.getElementById("auth-submit");
const authSwitchText = document.getElementById("auth-switch-text");
const authToggle = document.getElementById("auth-toggle");

let mode = "login"; // "login" or "signup"

function showError(text) {
  if (authError) authError.textContent = text;
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    showError("Could not save in this browser. Try Chrome or Edge.");
    return false;
  }
}

function getUsers() {
  return readStorage(USERS_KEY) || [];
}

function goHome() {
  window.location.replace(HOME_PAGE);
}

// If already logged in, go straight to the app
if (readStorage(CURRENT_KEY)) {
  goHome();
}

function setMode(newMode) {
  mode = newMode;
  showError("");

  if (mode === "signup") {
    if (authTitle) authTitle.textContent = "Create Account";
    if (authSubmit) authSubmit.textContent = "Sign Up";
    if (authSwitchText) authSwitchText.textContent = "Already have an account?";
    if (authToggle) authToggle.textContent = "Login";
    if (nameGroup) nameGroup.classList.remove("hidden");
  } else {
    if (authTitle) authTitle.textContent = "Welcome Back!";
    if (authSubmit) authSubmit.textContent = "Login";
    if (authSwitchText) authSwitchText.textContent = "New here?";
    if (authToggle) authToggle.textContent = "Create an account";
    if (nameGroup) nameGroup.classList.add("hidden");
  }
}

if (authToggle) {
  authToggle.addEventListener("click", () => {
    setMode(mode === "login" ? "signup" : "login");
  });
}

if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const users = getUsers();

    if (mode === "signup") {
      const name = nameInput ? nameInput.value.trim() : "";

      if (!name) {
        showError("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
      }
      if (users.some((u) => u.email === email)) {
        showError("An account with this email already exists.");
        return;
      }

      users.push({ name, email, password });
      if (!writeStorage(USERS_KEY, users)) return;
      if (!writeStorage(CURRENT_KEY, { name, email })) return;
      goHome();
    } else {
      const user = users.find((u) => u.email === email && u.password === password);

      if (!user) {
        showError("Wrong email or password. New here? Click 'Create an account'.");
        return;
      }

      if (!writeStorage(CURRENT_KEY, { name: user.name, email: user.email })) return;
      goHome();
    }
  });
}