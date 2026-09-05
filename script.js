const STORAGE_KEY = "signupUsers";

const form = document.getElementById("signupForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const usernameError = document.getElementById("usernameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formStatus = document.getElementById("formStatus");

const tableBody = document.getElementById("userTableBody");
const emptyState = document.getElementById("emptyState");
const userCount = document.getElementById("userCount");

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function clearErrors() {
  [usernameInput, emailInput, passwordInput].forEach(input => {
    input.classList.remove("invalid");
  });

  usernameError.textContent = "";
  emailError.textContent = "";
  passwordError.textContent = "";
}

function showError(input, errorElement, message) {
  input.classList.add("invalid");
  errorElement.textContent = message;
}

function validateInputs() {
  clearErrors();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let valid = true;

  if (username === "") {
    showError(usernameInput, usernameError, "Username cannot be empty.");
    valid = false;
  }

  // Basic email-format regex.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showError(emailInput, emailError, "Enter a valid email address.");
    valid = false;
  }

  if (password.length < 6) {
    showError(passwordInput, passwordError, "Password must be at least 6 characters.");
    valid = false;
  }

  return { valid, username, email, password };
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function renderUsers() {
  const users = getUsers();

  tableBody.innerHTML = "";

  users.forEach((user, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(user.username)}</td>
      <td>${escapeHTML(user.email)}</td>
      <td class="password-cell" title="${escapeHTML(user.password)}">
        ${escapeHTML(user.password)}
      </td>
      <td>
        <button class="delete-btn" data-index="${index}" type="button">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  emptyState.style.display = users.length === 0 ? "block" : "none";
  userCount.textContent = `${users.length} ${users.length === 1 ? "user" : "users"}`;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  formStatus.textContent = "";
  formStatus.className = "form-status";

  const result = validateInputs();

  if (!result.valid) {
    return;
  }

  const users = getUsers();

  // Hash the password before it ever gets written to localStorage.
  const hashedPassword = await hashPassword(result.password);

  users.push({
    username: result.username,
    email: result.email,
    password: hashedPassword
  });

  saveUsers(users);
  renderUsers();

  form.reset();
  clearErrors();

  formStatus.textContent = "Account created successfully!";
  formStatus.classList.add("success");
});

tableBody.addEventListener("click", (event) => {
  if (!event.target.classList.contains("delete-btn")) {
    return;
  }

  const index = Number(event.target.dataset.index);
  const users = getUsers();

  users.splice(index, 1);
  saveUsers(users);
  renderUsers();
});

renderUsers();
