"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
        // Load identity and tokens from localStorage
        const storedIdentity = localStorage.getItem("local_identity");
        if (storedIdentity) {
            try {
                const parsed = JSON.parse(storedIdentity);
                // Auto-fix legacy port 8080
                if (parsed.home_server && parsed.home_server.includes(":8080")) {
                    parsed.home_server = parsed.home_server.replace(":8080", ":8082");
                    localStorage.setItem("local_identity", JSON.stringify(parsed));
                }
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

        // Check if we're showing recovery key (don't redirect)
        const showingRecoveryKey = sessionStorage.getItem('showing_recovery_key') === 'true';

        if (!identity && !isPublicRoute) {
            // Not logged in and trying to access protected route -> go to login
            router.push("/login");
        } else if (identity && isUnauthenticatedOnly && !showingRecoveryKey) {
            // Logged in and visiting login/register -> go to profile
            // BUT: don't redirect if we're showing the recovery key
            router.push("/profile");
        }
    }, [identity, isLoading, pathname, router]);

    const login = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {
        // Auto-fix legacy port 8080 coming from backend
        if (homeServer && homeServer.includes(":8080")) {
            homeServer = homeServer.replace(":8080", ":8082");
        }
        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        router.push("/profile");
    };

    const loginWithoutRedirect = (userId: string, homeServer: string, accessToken: string, refreshToken: string) => {
        // Auto-fix legacy port 8080 coming from backend
        if (homeServer && homeServer.includes(":8080")) {
            homeServer = homeServer.replace(":8080", ":8082");
        }
        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        // No redirect - used during registration to show recovery key
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");

        // Call backend to revoke refresh token
        if (refreshToken) {
            try {
                await fetch('http://localhost:8082/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
            } catch (error) {
                console.error('Logout error:', error);
                // Continue with local logout even if backend call fails
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
            const res = await fetch('http://localhost:8082/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!res.ok) {
                // Refresh token is invalid or expired - logout user
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
