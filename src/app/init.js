import { getElements } from "../dom/elements.js";
import { createNewsletterState } from "../state/newsletterState.js";
import { createSessionStore, saveSessionTokens, clearSessionTokens } from "../state/sessionStore.js";
import { showMessage, setButtonLoading } from "../utils/messages.js";
import { updateScheduleUI, toggleWeekday } from "../ui/scheduleUI.js";
import { updateProgressUI } from "../ui/progressUI.js";
import { showSuccessModal, hideSuccessModal } from "../ui/successModal.js";
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
        showSuccessModal: (data) => showSuccessModal(elements, data),
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
        const updateProgress = () => updateProgressUI(elements, state);

        elements.scheduleTypeSelect.addEventListener("change", () => {
            updateScheduleUI(elements, state);
            updateProgress();
        });

        elements.weekdayButtons.forEach((button) => {
            button.addEventListener("click", () => {
                toggleWeekday(state, button);
                updateProgress();
            });
        });

        elements.submitBtn.addEventListener("click", () => submitNewsletter(elements.submitBtn));
        elements.loginBtn.addEventListener("click", handleLogin);
        elements.logoutBtn.addEventListener("click", handleLogout);
        if (elements.plansLoginBtn) {
            elements.plansLoginBtn.addEventListener("click", handleLogin);
        }
        if (elements.profileBtn && elements.profileMenu) {
            elements.profileBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                const isHidden = elements.profileMenu.classList.contains("hidden");
                elements.profileMenu.classList.toggle("hidden", !isHidden);
                elements.profileBtn.setAttribute("aria-expanded", String(isHidden));
            });

            document.addEventListener("click", () => {
                elements.profileMenu.classList.add("hidden");
                elements.profileBtn.setAttribute("aria-expanded", "false");
            });

            elements.profileMenu.addEventListener("click", (event) => {
                event.stopPropagation();
            });
        }

        if (elements.successModal) {
            const closeSuccessModal = () => hideSuccessModal(elements);
            elements.successModalClose?.addEventListener("click", closeSuccessModal);
            elements.successModalDone?.addEventListener("click", closeSuccessModal);
            elements.successModal.addEventListener("click", (event) => {
                if (event.target === elements.successModal) {
                    closeSuccessModal();
                }
            });
        }

        window.addEventListener("message", handleAuthMessage);

        elements.form.addEventListener("submit", (e) => e.preventDefault());

        const promptInput = document.getElementById("prompt");
        const readTimeInput = document.getElementById("read-time");
        const specificDateInput = document.getElementById("specific-date");
        const specificTimeInput = document.getElementById("specific-time");

        function updatePromptHighlight() {
            if (!promptInput) {
                return;
            }
            const hasValue = promptInput.value.trim().length > 0;
            promptInput.classList.toggle("ring-4", !hasValue);
            promptInput.classList.toggle("ring-blue-100", !hasValue);
        }

        promptInput?.addEventListener("input", () => {
            updateProgress();
            updatePromptHighlight();
        });
        readTimeInput?.addEventListener("input", updateProgress);
        specificDateInput?.addEventListener("change", updateProgress);
        specificTimeInput?.addEventListener("change", updateProgress);

        updatePromptHighlight();
    }

    function init() {
        initializeEventListeners();
        updateScheduleUI(elements, state);
        updateProgressUI(elements, state);
        _updateUIForAuthState();
        scheduleTokenRefresh(session, refreshSessionIfNeeded, _clearSessionTokens, false);
    }

    init();
}
