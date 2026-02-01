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
    login: (userId: string, homeServer: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [identity, setIdentity] = useState<LocalIdentity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Load identity from localStorage
        const storedIdentity = localStorage.getItem("local_identity");
        if (storedIdentity) {
            try {
                setIdentity(JSON.parse(storedIdentity));
            } catch (e) {
                console.error("Failed to parse identity", e);
                localStorage.removeItem("local_identity");
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const unauthenticatedOnlyRoutes = ["/login", "/register"];
        const authenticatedRoutes = ["/profile/setup", "/profile/edit"];

        const isUnauthenticatedOnly = unauthenticatedOnlyRoutes.includes(pathname);
        const isAuthenticatedRoute = authenticatedRoutes.includes(pathname);
        const isPublicRoute = isUnauthenticatedOnly || isAuthenticatedRoute;

        if (!identity && !isPublicRoute) {
            // Not logged in and trying to access protected route -> go to login
            router.push("/login");
        } else if (identity && isUnauthenticatedOnly) {
            // Logged in and visiting login/register -> go to profile
            router.push("/profile");
        }
    }, [identity, isLoading, pathname, router]);


    const login = (userId: string, homeServer: string) => {
        const newIdentity = { user_id: userId, home_server: homeServer };
        setIdentity(newIdentity);
        localStorage.setItem("local_identity", JSON.stringify(newIdentity));
        router.push("/profile");
    };

    const logout = () => {
        setIdentity(null);
        localStorage.removeItem("local_identity");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ identity, isLoading, login, logout }}>
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
