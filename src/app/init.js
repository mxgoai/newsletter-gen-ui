import { getElements } from "../dom/elements.js";
import { createNewsletterState } from "../state/newsletterState.js";
import { createSessionStore, saveSessionTokens, clearSessionTokens } from "../state/sessionStore.js";
import { showMessage, setButtonLoading } from "../utils/messages.js";
import { updateScheduleUI, toggleWeekday } from "../ui/scheduleUI.js";
import { updateUIForAuthState } from "../auth/authUI.js";
import { scheduleTokenRefresh, refreshSessionIfNeeded as _refreshSessionIfNeeded } from "../auth/refresh.js";
import { handleLogin, createAuthMessageHandler } from "../auth/bridge.js";
import { cleanupLogoutFrame, doLogoutFlow } from "../auth/logout.js";
import { createSubmitNewsletter } from "../newsletter/submit.js";

export function initApp() {
    const elements = getElements();
    const state = createNewsletterState();
    const session = createSessionStore();

    function _showMessage(message, type = "success") {
        showMessage(elements, message, type);
    }

    function _updateUIForAuthState() {
        updateUIForAuthState(elements, session);
    }

    function _saveSessionTokens(accessToken, refreshToken) {
        saveSessionTokens(session, accessToken, refreshToken);
        _updateUIForAuthState();
        scheduleTokenRefresh(session, refreshSessionIfNeeded, _clearSessionTokens, false);
    }

    function _clearSessionTokens() {
        clearSessionTokens(session);
        _updateUIForAuthState();
        scheduleTokenRefresh(session, refreshSessionIfNeeded, _clearSessionTokens, true);
    }

    async function refreshSessionIfNeeded(force = false) {
        return _refreshSessionIfNeeded(
            session,
            (a, r) => _saveSessionTokens(a, r),
            () => _clearSessionTokens(),
            force
        );
    }

    function handleLogout() {
        doLogoutFlow(
            elements,
            session,
            () => _clearSessionTokens(),
            () => _updateUIForAuthState(),
            (msg, type) => _showMessage(msg, type)
        );
    }

    const submitNewsletter = createSubmitNewsletter({
        state,
        session,
        setButtonLoading,
        showMessage: _showMessage,
        refreshSessionIfNeeded,
        handleLogout,
    });

    const handleAuthMessage = createAuthMessageHandler({
        saveTokens: _saveSessionTokens,
        clearTokens: _clearSessionTokens,
        cleanupLogoutFrame,
        showMessage: _showMessage,
    });

    function initializeEventListeners() {
        elements.scheduleTypeSelect.addEventListener("change", () => updateScheduleUI(elements, state));

        elements.weekdayButtons.forEach((button) => {
            button.addEventListener("click", () => toggleWeekday(state, button));
        });

        elements.submitBtn.addEventListener("click", () => submitNewsletter(elements.submitBtn));
        elements.loginBtn.addEventListener("click", handleLogin);
        elements.logoutBtn.addEventListener("click", handleLogout);

        window.addEventListener("message", handleAuthMessage);

        elements.form.addEventListener("submit", (e) => e.preventDefault());
    }

    function init() {
        initializeEventListeners();
        updateScheduleUI(elements, state);
        _updateUIForAuthState();
        scheduleTokenRefresh(session, refreshSessionIfNeeded, _clearSessionTokens, false);
    }

    init();
}
