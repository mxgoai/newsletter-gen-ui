import { parseJwt } from "../utils/jwt.js";

export function updateUIForAuthState(elements, session) {
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
