const API_BASE_URL = "http://localhost:8000";
const API_ENDPOINTS = {
  CREATE_NEWSLETTER: "/create-newsletter",
};

const state = {
  scheduleType: "immediate",
  selectedDays: [],
};

// DOM Elements
const elements = {
  form: document.getElementById("newsletter-form"),
  scheduleTypeSelect: document.getElementById("schedule-type"),
  specificDateTimeSection: document.getElementById("specific-datetime"),
  customRecurringSection: document.getElementById("custom-recurring"),
  weekdayButtons: document.querySelectorAll(".weekday-btn"),
  submitBtn: document.getElementById("submit-btn"),
  messageContainer: document.getElementById("message-container"),

  loginContainer: document.getElementById("login-container"),
  appContainer: document.getElementById("app-container"),
  loginBtn: document.getElementById("login-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  userInfo: document.getElementById("user-info"),
  userEmail: document.getElementById("user-email"),
};

const session = {
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken")
}

// --- UTILITY FUNCTIONS ---

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return null;
  }
}

function generateUUID() {
  return crypto.randomUUID();
}

function showMessage(message, type = "success") {
  elements.messageContainer.textContent = message;
  elements.messageContainer.className = `message-container ${type}`;
  elements.messageContainer.classList.remove("hidden");
  elements.messageContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => {
    elements.messageContainer.classList.add("hidden");
  }, 10000);
}

function setButtonLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("btn-loading", isLoading);
}

function combineDateTimeToISO(date, time) {
  if (!date || !time) return null;
  const localDateTime = new Date(`${date}T${time}`);
  return localDateTime.toISOString();
}

// --- UI UPDATE FUNCTIONS ---

function updateScheduleUI() {
  const scheduleType = elements.scheduleTypeSelect.value;
  state.scheduleType = scheduleType;
  elements.specificDateTimeSection.classList.add("hidden");
  elements.customRecurringSection.classList.add("hidden");
  if (scheduleType === "specific") {
    elements.specificDateTimeSection.classList.remove("hidden");
  } else if (scheduleType === "recurring") {
    elements.customRecurringSection.classList.remove("hidden");
  }
}

function toggleWeekday(button) {
  const day = parseInt(button.dataset.day, 10);
  button.classList.toggle("active");
  if (button.classList.contains("active")) {
    if (!state.selectedDays.includes(day)) {
      state.selectedDays.push(day);
    }
  } else {
    state.selectedDays = state.selectedDays.filter((d) => d !== day);
  }
}

function convertLocalTimeToUTC(timeString) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  const localDate = new Date();
  localDate.setHours(hours, minutes, 0, 0);
  const utcHours = localDate.getUTCHours();
  const utcMinutes = localDate.getUTCMinutes();
  return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
}

// --- PAYLOAD & VALIDATION ---

function buildPayload() {
  return {
    request_id: generateUUID(),
    prompt: document.getElementById("prompt").value.trim(),
    estimated_read_time: parseInt(document.getElementById("read-time").value, 10) || null,
    sources: document.getElementById("sources").value.trim().split(',').map(s => s.trim()).filter(s => s) || null,
    geographic_locations: document.getElementById("locations").value.trim().split(',').map(l => l.trim()).filter(l => l) || null,
    formatting_instructions: null,
    schedule: buildScheduleObject(),
  };
}

function buildScheduleObject() {
  switch (state.scheduleType) {
    case "immediate":
      return { type: "IMMEDIATE", specific_datetime: null, weekly_schedule: null };
    case "specific":
      const date = document.getElementById("specific-date").value;
      const time = document.getElementById("specific-time").value;
      return { type: "SPECIFIC_DATES", specific_datetime: combineDateTimeToISO(date, time), weekly_schedule: null };
    case "recurring":
      const localTime = document.getElementById("recurring-time").value || "09:00";
      const utcTime = convertLocalTimeToUTC(localTime);
      return {
        type: "RECURRING_WEEKLY",
        specific_datetime: null,
        weekly_schedule: { days: state.selectedDays.sort(), time: utcTime },
      };
    default:
      return { type: "IMMEDIATE", specific_datetime: null, weekly_schedule: null };
  }
}

function validateForm() {
  if (!document.getElementById("prompt").value.trim()) {
    showMessage("Please enter a newsletter prompt.", "error");
    return false;
  }
  if (!document.getElementById("read-time").value) {
    showMessage("Please enter an estimated read time.", "error");
    return false;
  }
  if (state.scheduleType === "specific") {
    const date = document.getElementById("specific-date").value;
    const time = document.getElementById("specific-time").value;
    if (!date || !time) {
      showMessage("Please select both a date and time for specific scheduling.", "error");
      return false;
    }
    if (new Date(`${date}T${time}`) < new Date()) {
      showMessage("The scheduled date and time must be in the future.", "error");
      return false;
    }
  }
  if (state.scheduleType === "recurring" && state.selectedDays.length === 0) {
    showMessage("Please select at least one day for a recurring schedule.", "error");
    return false;
  }
  return true;
}

// --- Auth ---
function updateUIForAuthState() {
  if (session.accessToken) {
    elements.loginContainer.classList.add("hidden");
    elements.appContainer.classList.remove("hidden");
    elements.userInfo.classList.remove("hidden");
    const decodedToken = parseJwt(session.accessToken);
    if (decodedToken && decodedToken.email) {
      elements.userEmail.textContent = `Logged in as: ${decodedToken.email}`;
    }
  } else {
    elements.loginContainer.classList.remove("hidden");
    elements.appContainer.classList.add("hidden");
    elements.userInfo.classList.add("hidden");
    elements.userEmail.textContent = "";
  }
}

function handleLogin() {
  const redirectUri = "https://www.mxgo.ai/auth/accept-session";
  const authUrl = `${SUPABASE_CONFIG.URL}/auth/v1/authorize?provider=google&redirect_to=${redirectUri}`;

  window.open(authUrl, "authWindow", "width=500,height=600");
}

function handleLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  session.accessToken = null;
  session.refreshToken = null;
  updateUIForAuthState();
  showMessage("You have been logged out.", "success");

  const logoutUrl = "https://www.mxgo.ai/auth/extension-logout";
  window.open(logoutUrl, "logoutWindow", "width=100,height=100,left=9999,top=9999");
}

function handleAuthMessage(event) {
  const trustedOrigin = "https://www.mxgo.ai";
  if (event.origin !== trustedOrigin) {
    return;
  }

  if (event.data?.type === 'auth-token' && event.data.payload) {
    const { accessToken, refreshToken } = event.data.payload;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    updateUIForAuthState();
    showMessage("Logged in successfully!", "success");
  }
}

// --- API & SUBMISSION ---

async function submitNewsletter(buttonElement) {
  if (!validateForm()) return;
  setButtonLoading(buttonElement, true);
  try {
    const payload = buildPayload();
    const token = session.accessToken;
    if (!token) {
      showMessage("Authentication required. Please log in.", "error");
      handleLogout();
      setButtonLoading(buttonElement, false);
      return;
    }
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_NEWSLETTER}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    response.ok ? handleSuccess(data) : handleError(response.status, data);
  } catch (error) {
    console.error("Error submitting newsletter:", error);
    showMessage("Network error. Please check your connection and try again.", "error");
  } finally {
    setButtonLoading(buttonElement, false);
  }
}

function handleSuccess(data) {
  let message = data.is_scheduled ? "Newsletter scheduled successfully!" : "Newsletter generated successfully!";
  if (data.scheduled_task_ids?.length > 0) {
    message += ` Task IDs: ${data.scheduled_task_ids.join(", ")}`;
  }
  if (data.sample_email_sent) {
    message += " A sample email has been sent.";
  }
  showMessage(message, "success");
}

function handleError(status, data) {
  let errorMessage = data.detail?.message || data.detail || "An error occurred. Please try again.";
  switch (status) {
    case 401:
      errorMessage = "Your session has expired. Please log in again.";
      handleLogout();
      break;
    case 403:
      errorMessage = "You have reached the newsletter limit for your plan.";
      break;
    case 409:
      errorMessage = "This request has already been processed.";
      break;
  }
  showMessage(errorMessage, "error");
}

// --- INITIALIZATION ---

function initializeEventListeners() {
  elements.scheduleTypeSelect.addEventListener("change", updateScheduleUI);
  elements.weekdayButtons.forEach((button) => {
    button.addEventListener("click", () => toggleWeekday(button));
  });
  elements.submitBtn.addEventListener("click", () => submitNewsletter(elements.submitBtn));
  elements.loginBtn.addEventListener("click", handleLogin);
  elements.logoutBtn.addEventListener("click", handleLogout);
  window.addEventListener("message", handleAuthMessage);
  elements.form.addEventListener("submit", (e) => e.preventDefault());
}

function init() {
  initializeEventListeners();
  updateScheduleUI();
  updateUIForAuthState();
}

document.addEventListener("DOMContentLoaded", init);