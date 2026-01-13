function getStoredTokenOrNull(key) {
    const value = localStorage.getItem(key);
    return typeof value === "string" ? value : null;
}

export function createSessionStore() {
    return {
        accessToken: getStoredTokenOrNull("accessToken"),
        refreshToken: getStoredTokenOrNull("refreshToken"),
    };
}

export function saveSessionTokens(session, accessToken, refreshToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
}

export function clearSessionTokens(session) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    session.accessToken = null;
    session.refreshToken = null;
}
