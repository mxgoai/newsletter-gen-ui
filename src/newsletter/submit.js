import { API_BASE_URL, API_ENDPOINTS } from "../config/api.js";
import { buildPayload } from "./payload.js";
import { validateForm } from "./validate.js";

export function handleSuccess(showMessage, data, showSuccessModal) {
    let message = data.is_scheduled ? "Newsletter scheduled successfully!" : "Newsletter generated successfully!";
    if (data.scheduled_task_ids?.length > 0) {
        message += ` Task IDs: ${data.scheduled_task_ids.join(", ")}`;
    }
    if (data.sample_email_sent) {
        message += " A sample email has been sent.";
    }
    showMessage(message, "success");
    if (showSuccessModal) {
        showSuccessModal(data);
    }
}

export function handleError(showMessage, handleLogout, status, data) {
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

export function createSubmitNewsletter({
    state,
    session,
    setButtonLoading,
    showMessage,
    showSuccessModal,
    refreshSessionIfNeeded,
    handleLogout,
}) {
    return async function submitNewsletter(buttonElement) {
        if (!validateForm(state, showMessage)) return;

        setButtonLoading(buttonElement, true);

        try {
            const ok = await refreshSessionIfNeeded(false);
            if (!ok) {
                showMessage("Authentication required. Please log in.", "error");
                handleLogout();
                setButtonLoading(buttonElement, false);
                return;
            }

            const payload = buildPayload(state);
            const token = session.accessToken;

            if (!token) {
                showMessage("Authentication required. Please log in.", "error");
                handleLogout();
                setButtonLoading(buttonElement, false);
                return;
            }

            let response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_NEWSLETTER}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 401) {
                const refreshed = await refreshSessionIfNeeded(true);
                if (!refreshed || !session.accessToken) {
                    showMessage("Your session has expired. Please log in again.", "error");
                    handleLogout();
                    setButtonLoading(buttonElement, false);
                    return;
                }

                response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_NEWSLETTER}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            const data = await response.json();
            response.ok
                ? handleSuccess(showMessage, data, showSuccessModal)
                : handleError(showMessage, handleLogout, response.status, data);
        } catch (error) {
            console.error("Error submitting newsletter:", error);
            showMessage("Network error. Please check your connection and try again.", "error");
        } finally {
            setButtonLoading(buttonElement, false);
        }
    };
}
