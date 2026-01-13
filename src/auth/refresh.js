import { getJwtExpMs } from "../utils/jwt.js";

let refreshTimer = null;

function getSupabaseConfig() {
    return window.SUPABASE_CONFIG || null;
}

export async function refreshSessionIfNeeded(session, saveSessionTokensFn, clearSessionTokensFn, force = false) {
    const accessToken = session.accessToken;
    const refreshToken = session.refreshToken;

    if (!refreshToken) return false;

    const expMs = accessToken ? getJwtExpMs(accessToken) : 0;
    const now = Date.now();

    if (!force && expMs && expMs - now > 60_000) return true;

    const SUPABASE_CONFIG = getSupabaseConfig();
    if (!SUPABASE_CONFIG?.URL || !SUPABASE_CONFIG?.ANON_KEY) {
        return !!session.accessToken;
    }

    try {
        const res = await fetch(`${SUPABASE_CONFIG.URL}/auth/v1/token?grant_type=refresh_token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_CONFIG.ANON_KEY,
                Authorization: `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
            clearSessionTokensFn();
            return false;
        }

        const data = await res.json();
        if (!data?.access_token || !data?.refresh_token) {
            clearSessionTokensFn();
            return false;
        }

        saveSessionTokensFn(data.access_token, data.refresh_token);
        return true;
    } catch (error) {
        console.error("Failed to refresh Supabase session:", error);
        return !!session.accessToken;
    }
}

export function scheduleTokenRefresh(session, refreshSessionIfNeededFn, clearSessionTokensFn, stop = false) {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;

    if (stop) return;

    const accessToken = session.accessToken;
    if (!accessToken) return;

    const expMs = getJwtExpMs(accessToken);
    if (!expMs) return;

    const now = Date.now();
    const fireIn = Math.max(5_000, expMs - now - 60_000);

    refreshTimer = setTimeout(() => {
        refreshSessionIfNeededFn(true).catch(() => {
            clearSessionTokensFn();
        });
    }, fireIn);
}
