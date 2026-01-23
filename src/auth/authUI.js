import { parseJwt } from "../utils/jwt.js";

export function updateUIForAuthState(elements, session) {
    if (session.accessToken) {
        // User is logged in
        // Hide login button, show create button
        elements.loginBtn.classList.add("hidden");
        elements.submitBtn.classList.remove("hidden");
        elements.userInfo.classList.remove("hidden");

        const decodedToken = parseJwt(session.accessToken);
        if (decodedToken && decodedToken.email) {
            elements.userEmail.textContent = `Logged in as: ${decodedToken.email}`;
        }
        
        // Legacy container handling (for compatibility)
        elements.loginContainer.classList.add("hidden");
        elements.appContainer.classList.add("hidden");
    } else {
        // User is not logged in
        // Show login button, hide create button
        elements.loginBtn.classList.remove("hidden");
        elements.submitBtn.classList.add("hidden");
        elements.userInfo.classList.add("hidden");
        elements.userEmail.textContent = "";
        
        // Legacy container handling (for compatibility)
        elements.loginContainer.classList.add("hidden");
        elements.appContainer.classList.add("hidden");
    }
}
