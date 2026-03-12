"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

// Auth routes that should NOT show the sidebar
const AUTH_ROUTES = ["/login", "/register", "/recover", "/profile/setup", "/add-account"];

export default function ConditionalSidebar() {
    const pathname = usePathname();
    const isAuthPage = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
    if (isAuthPage) return null;
    return <Sidebar />;
}
