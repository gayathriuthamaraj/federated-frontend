"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiPost } from '../utils/api';
import { useRouter, usePathname } from "next/navigation";

export interface LocalIdentity {
    user_id: string;
    home_server: string;
}

interface AuthContextType {
    identity: LocalIdentity | null;
    isLoading: boolean;
    login: (userId: string, homeServer: string, accessToken: string, refreshToken: string) => void;
    loginWithoutRedirect: (userId: string, homeServer: string, accessToken: string, refreshToken: string) => void;
    logout: () => Promise<void>;
    getAuthHeaders: () => HeadersInit;
    refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [identity, setIdentity] = useState<LocalIdentity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {

        // One-time fix: correct any previously-stored wrong hostnames/ports
        // Covers: Docker-internal container names, old wrong ports
        ['local_identity', 'trusted_server'].forEach((key) => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const fixed = raw
                // Docker-internal container hostnames → public localhost URLs
                .replace(/http:\/\/server[_-]a[_-]identity:\d+/g, 'http://localhost:8080')
                .replace(/http:\/\/server[_-]b[_-]identity:\d+/g, 'http://localhost:9080')
                // Old wrong default port (pre-docker-compose fix)
                .replace('localhost:8082', 'localhost:8080')
                .replace('localhost:9082', 'localhost:9080');
            if (fixed !== raw) localStorage.setItem(key, fixed);
        });

        const storedIdentity = localStorage.getItem("local_identity");
        if (storedIdentity) {
            try {
                const parsed = JSON.parse(storedIdentity);
                setIdentity(parsed);
            } catch (e) {
                console.error("Failed to parse identity", e);
                localStorage.removeItem("local_identity");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
            }
        }
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

    const login = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {

        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        router.push("/feed");
    };

    const loginWithoutRedirect = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {

        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);

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

        setIdentity(null);
        localStorage.removeItem("local_identity");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
    };

    const getAuthHeaders = (): HeadersInit => {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            };
        }
        return {
            'Content-Type': 'application/json',
        };
    };

    const refreshAccessToken = async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            return false;
        }

        try {
            const res = await apiPost('/refresh-token', { refresh_token: refreshToken }, false);

            if (!res.ok) {

                await logout();
                return false;
            }

            const data = await res.json();
            localStorage.setItem("access_token", data.access_token);
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
            login,
            loginWithoutRedirect,
            logout,
            getAuthHeaders,
            refreshAccessToken
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
