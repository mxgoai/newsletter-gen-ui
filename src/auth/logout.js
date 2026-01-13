import { AUTH_LOGOUT_URL } from "../config/auth.js";

let logoutFrame = null;
let logoutFrameTimer = null;

export function cleanupLogoutFrame() {
    if (logoutFrameTimer) clearTimeout(logoutFrameTimer);
    logoutFrameTimer = null;
    if (logoutFrame && logoutFrame.parentNode) logoutFrame.parentNode.removeChild(logoutFrame);
    logoutFrame = null;
}

export function doLogoutFlow(elements, session, clearSessionTokensFn, updateUIForAuthStateFn, showMessageFn) {
    clearSessionTokensFn();
    updateUIForAuthStateFn();
    showMessageFn("You have been logged out.", "success");

    cleanupLogoutFrame();

    const openerOrigin = window.location.origin;
    const logoutUrl = `${AUTH_LOGOUT_URL}?opener_origin=${encodeURIComponent(openerOrigin)}`;

    logoutFrame = document.createElement("iframe");
    logoutFrame.src = logoutUrl;
    logoutFrame.title = "mxgo-logout";
    logoutFrame.setAttribute("aria-hidden", "true");
    logoutFrame.style.width = "0";
    logoutFrame.style.height = "0";
    logoutFrame.style.border = "0";
    logoutFrame.style.position = "fixed";
    logoutFrame.style.left = "-9999px";
    logoutFrame.style.top = "-9999px";
    logoutFrame.style.opacity = "0";
    logoutFrame.style.pointerEvents = "none";

    document.body.appendChild(logoutFrame);

    logoutFrameTimer = setTimeout(() => {
        cleanupLogoutFrame();
    }, 4000);
}
