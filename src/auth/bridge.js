import { AUTH_BRIDGE_URL, AUTH_ORIGIN } from "../config/auth.js";

let authPopup = null;

export function extractTokensFromBridgeMessage(data) {
    if (!data) return null;

    if (data?.type && data.type !== "MX_AUTH_SESSION" && data.type !== "auth-token") return null;

    const payload = data.payload || data.auth || data.tokens || null;

    const a =
        payload?.access_token ||
        payload?.accessToken ||
        data?.access_token ||
        data?.accessToken ||
        null;

    const r =
        payload?.refresh_token ||
        payload?.refreshToken ||
        data?.refresh_token ||
        data?.refreshToken ||
        null;

    if (!a || !r) return null;

    return { accessToken: a, refreshToken: r };
}

export function handleLogin() {
    if (authPopup && !authPopup.closed) {
        authPopup.focus();
        return;
    }

    const openerOrigin = window.location.origin;
    const url = `${AUTH_BRIDGE_URL}?opener_origin=${encodeURIComponent(openerOrigin)}`;

    authPopup = window.open(url, "authWindow", "width=520,height=680,resizable=yes,scrollbars=yes");
}

export function createAuthMessageHandler({
    saveTokens,
    clearTokens,
    cleanupLogoutFrame,
    showMessage,
}) {
    return function handleAuthMessage(event) {
        if (event.origin !== AUTH_ORIGIN) {
            return;
        }

        if (authPopup && event.source && event.source !== authPopup) {
            return;
        }

        if (event.data?.source && event.data.source !== "mxgo") {
            return;
        }

        if (event.data?.type === "MX_WEB_LOGOUT_COMPLETE") {
            clearTokens();
            cleanupLogoutFrame();
            return;
        }

        const tokens = extractTokensFromBridgeMessage(event.data);
        if (tokens) {
            saveTokens(tokens.accessToken, tokens.refreshToken);
            showMessage("Logged in successfully!", "success");
            try {
                if (authPopup && !authPopup.closed) authPopup.close();
            } catch (error) {
                // Log the error to aid debugging while keeping user-facing behavior unchanged.
                // This is intentionally non-fatal, as failure to close the popup is not critical.
                console.error("Failed to close auth popup window:", error);
            }
            authPopup = null;
        }
    };
}
