"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiPost } from '../utils/api';
import { useRouter, usePathname } from "next/navigation";

export interface LocalIdentity {
    user_id: string;
    home_server: string;
}

export interface AccountSession {
    user_id: string;
    home_server: string;
    access_token: string;
    refresh_token: string;
}

// ── localStorage helpers (run outside React) ─────────────────────────────────
function readSessionsStorage(): AccountSession[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem("account_sessions");
        return raw ? (JSON.parse(raw) as AccountSession[]) : [];
    } catch { return []; }
}
function writeSessionsStorage(sessions: AccountSession[]) {
    if (typeof window !== 'undefined')
        localStorage.setItem("account_sessions", JSON.stringify(sessions));
}
function upsertSessionStorage(session: AccountSession) {
    const all = readSessionsStorage();
    const idx = all.findIndex(s => s.user_id === session.user_id);
    if (idx >= 0) all[idx] = session; else all.push(session);
    writeSessionsStorage(all);
}
function removeSessionStorage(userId: string) {
    writeSessionsStorage(readSessionsStorage().filter(s => s.user_id !== userId));
}

interface AuthContextType {
    identity: LocalIdentity | null;
    isLoading: boolean;
    sessions: AccountSession[];
    login: (userId: string, homeServer: string, accessToken: string, refreshToken: string) => void;
    loginWithoutRedirect: (userId: string, homeServer: string, accessToken: string, refreshToken: string) => void;
    logout: () => Promise<void>;
    addSession: (userId: string, homeServer: string, accessToken: string, refreshToken: string) => void;
    removeSession: (userId: string) => void;
    /** Try passwordless switch via linked-account token exchange.
     *  Returns true on success, false if no confirmed link (caller should ask for password). */
    switchToLinked: (targetUserId: string, targetHomeServer: string) => Promise<boolean>;
    getAuthHeaders: () => HeadersInit;
    refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [identity, setIdentity] = useState<LocalIdentity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessions, setSessions] = useState<AccountSession[]>([]);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // One-time fix: correct any previously-stored wrong hostnames/ports
        ['local_identity', 'trusted_server'].forEach((key) => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const fixed = raw
                .replace(/http:\/\/server[_-]a[_-]identity:\d+/g, 'http://localhost:8080')
                .replace(/http:\/\/server[_-]b[_-]identity:\d+/g, 'http://localhost:9080')
                .replace('localhost:8082', 'localhost:8080')
                .replace('localhost:9082', 'localhost:9080');
            if (fixed !== raw) localStorage.setItem(key, fixed);
        });

        const storedIdentity = localStorage.getItem("local_identity");
        if (storedIdentity) {
            try {
                const parsed = JSON.parse(storedIdentity);
                setIdentity(parsed);
                // Ensure active session is in the sessions list
                const token = localStorage.getItem("access_token") || '';
                const refresh = localStorage.getItem("refresh_token") || '';
                upsertSessionStorage({ user_id: parsed.user_id, home_server: parsed.home_server, access_token: token, refresh_token: refresh });
            } catch (e) {
                console.error("Failed to parse identity", e);
                localStorage.removeItem("local_identity");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
            }
        }
        setSessions(readSessionsStorage());
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        const unauthenticatedOnlyRoutes = ["/login", "/register"];
        const authenticatedRoutes = ["/profile/setup", "/profile/edit"];
        const publicShowcaseRoutes = ["/demo", "/feed", "/followers", "/following", "/notifications", "/explore", "/messages", "/test"];
        const isUnauthenticatedOnly = unauthenticatedOnlyRoutes.includes(pathname);
        const isAuthenticatedRoute = authenticatedRoutes.includes(pathname);
        const isPublicShowcase = publicShowcaseRoutes.includes(pathname) || pathname.startsWith("/showcase");
        const isPublicRoute = isUnauthenticatedOnly || isAuthenticatedRoute || isPublicShowcase;
        const showingRecoveryKey = sessionStorage.getItem('showing_recovery_key') === 'true';

        if (!identity && !isPublicRoute) {
            router.push("/login");
        } else if (identity && isUnauthenticatedOnly && !showingRecoveryKey) {
            router.push("/feed");
        }
    }, [identity, isLoading, pathname, router]);

    // Auto-populate the session switcher with confirmed linked accounts whenever
    // the active identity changes (on login, account switch, page reload).
    useEffect(() => {
        if (!identity) return;
        fetch(`${identity.home_server}/account/links?user_id=${encodeURIComponent(identity.user_id)}`)
            .then(r => { if (r.ok) return r.json(); throw new Error(); })
            .then(data => {
                (data.links || [])
                    .filter((l: { status: string }) => l.status === 'confirmed')
                    .forEach((l: { is_inbound: boolean; requester_id: string; target_id: string }) => {
                        const peerId = l.is_inbound ? l.requester_id : l.target_id;
                        upsertSessionStorage({ user_id: peerId, home_server: identity.home_server, access_token: '', refresh_token: '' });
                    });
                setSessions(readSessionsStorage());
            })
            .catch(() => { /* non-critical */ });
    }, [identity?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── helpers ──────────────────────────────────────────────────────────────

    const addSession = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {
        upsertSessionStorage({ user_id: userId, home_server: homeServer, access_token: accessToken, refresh_token: refreshToken });
        setSessions(readSessionsStorage());
    };

    const removeSession = (userId: string) => {
        removeSessionStorage(userId);
        setSessions(readSessionsStorage());
    };

    /** Attempt passwordless switch via /account/link/switch.
     *  Saves current session, sets new identity, returns true on success. */
    const switchToLinked = async (targetUserId: string, targetHomeServer: string): Promise<boolean> => {
        if (!identity) return false;
        const currentToken = localStorage.getItem("access_token");
        if (!currentToken) return false;
        try {
            const res = await fetch(`${identity.home_server}/account/link/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify({ from_user_id: identity.user_id, to_user_id: targetUserId }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            // Persist current session before switching
            upsertSessionStorage({ user_id: identity.user_id, home_server: identity.home_server, access_token: currentToken, refresh_token: localStorage.getItem("refresh_token") || '' });
            // Activate new session
            const newId = { user_id: data.user_id, home_server: data.home_server };
            setIdentity(newId);
            localStorage.setItem("local_identity", JSON.stringify(newId));
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            upsertSessionStorage({ user_id: data.user_id, home_server: data.home_server, access_token: data.access_token, refresh_token: data.refresh_token });
            setSessions(readSessionsStorage());
            return true;
        } catch {
            return false;
        }
    };

    // ── core auth ─────────────────────────────────────────────────────────────

    const login = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {
        // Persist old session so it can be switched back to
        if (identity) {
            const oldToken = localStorage.getItem("access_token");
            const oldRefresh = localStorage.getItem("refresh_token");
            if (oldToken) upsertSessionStorage({ user_id: identity.user_id, home_server: identity.home_server, access_token: oldToken, refresh_token: oldRefresh || '' });
        }
        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        upsertSessionStorage({ user_id: userId, home_server: homeServer, access_token: accessToken, refresh_token: refreshToken });
        setSessions(readSessionsStorage());
        router.push("/feed");
    };

    const loginWithoutRedirect = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {
        if (identity) {
            const oldToken = localStorage.getItem("access_token");
            const oldRefresh = localStorage.getItem("refresh_token");
            if (oldToken) upsertSessionStorage({ user_id: identity.user_id, home_server: identity.home_server, access_token: oldToken, refresh_token: oldRefresh || '' });
        }
        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        upsertSessionStorage({ user_id: userId, home_server: homeServer, access_token: accessToken, refresh_token: refreshToken });
        setSessions(readSessionsStorage());
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
            try {
                await apiPost('/logout', { refresh_token: refreshToken }, false);
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        // Remove current session from the saved list
        if (identity) removeSessionStorage(identity.user_id);
        setSessions(readSessionsStorage());

        setIdentity(null);
        localStorage.removeItem("local_identity");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
    };

    const getAuthHeaders = (): HeadersInit => {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
            return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` };
        }
        return { 'Content-Type': 'application/json' };
    };

    const refreshAccessToken = async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) return false;
        try {
            const res = await apiPost('/refresh-token', { refresh_token: refreshToken }, false);
            if (!res.ok) { await logout(); return false; }
            const data = await res.json();
            localStorage.setItem("access_token", data.access_token);
            // Keep stored session up-to-date
            if (identity) upsertSessionStorage({ user_id: identity.user_id, home_server: identity.home_server, access_token: data.access_token, refresh_token: refreshToken });
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            identity,
            isLoading,
            sessions,
            login,
            loginWithoutRedirect,
            logout,
            addSession,
            removeSession,
            switchToLinked,
            getAuthHeaders,
            refreshAccessToken,
        }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
