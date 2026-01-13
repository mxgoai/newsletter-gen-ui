export function getElements() {
    return {
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
}
