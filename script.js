// API Configuration
const API_BASE_URL = "http://localhost:8000";
const API_ENDPOINTS = {
  CREATE_NEWSLETTER: "/create-newsletter",
};

const DEV_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfMTIzIiwiZW1haWwiOiJiaGF2ZXNoa3VrcmVqYTI5QGdtYWlsLmNvbSIsImV4cCI6MTc2NjQ5NjI1MywiaWF0IjoxNzY2NDkyNjUzLCJhdWQiOiJhdXRoZW50aWNhdGVkIn0.nPfTP-1XDmkbrLnm4hk43Ka4SAOMHO_zUg2s4ZZUtA8";

// State Management
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
};

// --- UTILITY FUNCTIONS ---

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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

  // Format back to "HH:MM"
  return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
}

// --- PAYLOAD & VALIDATION ---

function buildPayload() {
  const payload = {
    request_id: generateUUID(),
    prompt: document.getElementById("prompt").value.trim(),
    estimated_read_time: parseInt(document.getElementById("read-time").value, 10) || null,
    sources: document.getElementById("sources").value.trim().split(',').map(s => s.trim()).filter(s => s) || null,
    geographic_locations: document.getElementById("locations").value.trim().split(',').map(l => l.trim()).filter(l => l) || null,
    formatting_instructions: null, // This can be added if a field is created in HTML
    schedule: buildScheduleObject(),
  };
  return payload;
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
        weekly_schedule: {
          days: state.selectedDays.sort(),
          time: utcTime,
        },
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
  if (!state.scheduleType || state.scheduleType === "") {
    showMessage("Please select when you want the newsletter sent.", "error");
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


// --- API & SUBMISSION ---

async function submitNewsletter(buttonElement) {
  if (!validateForm()) return;

  setButtonLoading(buttonElement, true);

  try {
    const payload = buildPayload();
    const token = DEV_JWT_TOKEN;

    if (!token) {
      showMessage("Authentication required. Please log in.", "error");
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

  elements.form.addEventListener("submit", (e) => e.preventDefault());
}

function init() {
  initializeEventListeners();
  updateScheduleUI();
}

document.addEventListener("DOMContentLoaded", init);