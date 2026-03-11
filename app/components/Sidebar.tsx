"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NavItem } from "./navItem";
import { useAuth } from "../context/AuthContext";
import type { AccountSession } from "../context/AuthContext";

import MenuSvg from "../icons/menu_svg";
import Home_svg from "../icons/home_svg";
import Search_svg from "../icons/search_svg";
import Message_svg from "../icons/message_svg";
import Profile_svg from "../icons/profile_svg";
import PostSvg from "../icons/post_svg";
import NotifSvg from "../icons/notif_svg";
import Follow_svg from "../icons/follow_svg";
import Community_svg from "../icons/community_svg";

/** Animated 3D Gotham logo */
function GothamLogo({ size = 28 }: { size?: number }) {
    return (
        <div
            className="animate-float-3d"
            style={{
                filter: "drop-shadow(0 4px 12px rgba(79,70,229,0.35)) drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
                transformStyle: "preserve-3d",
                display: "inline-block",
            }}
        >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logoGrad" x1="2" y1="5" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                </defs>
                <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill="url(#logoGrad)" />
            </svg>
        </div>
    );
}

export default function Sidebar() {
    const [expanded, setExpanded] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [switchingTo, setSwitchingTo] = useState<string | null>(null);
    const [passwordFor, setPasswordFor] = useState<string | null>(null);
    const [switchPassword, setSwitchPassword] = useState('');
    const [switchError, setSwitchError] = useState('');
    const [switchLoading, setSwitchLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const pathname = usePathname();
    const router = useRouter();
    const { identity, logout, sessions, switchToLinked, loginWithoutRedirect, addSession, removeSession } = useAuth();

    useEffect(() => {
        if (!identity) return;
        const fetchUnread = async () => {
            try {
                const res = await fetch(
                    `${identity.home_server}/notifications?user_id=${encodeURIComponent(identity.user_id)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    const count = (data.notifications || []).filter((n: { is_read: boolean }) => !n.is_read).length;
                    setUnreadCount(count);
                }
            } catch { /* non-critical */ }
        };
        fetchUnread();
        const id = setInterval(fetchUnread, 30_000);
        return () => clearInterval(id);
    }, [identity]);

    useEffect(() => {
        if (pathname.startsWith('/notifications')) setUnreadCount(0);
    }, [pathname]);

    const handleSwitchTo = async (session: AccountSession) => {
        setSwitchingTo(session.user_id);
        const ok = await switchToLinked(session.user_id, session.home_server);
        setSwitchingTo(null);
        if (ok) {
            setShowSwitcher(false);
            router.push('/feed');
        } else {
            setPasswordFor(session.user_id);
            setSwitchPassword('');
            setSwitchError('');
        }
    };

    const handlePasswordSwitch = async (session: AccountSession) => {
        setSwitchLoading(true);
        setSwitchError('');
        try {
            const res = await fetch(`${session.home_server}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: session.user_id.split('@')[0], password: switchPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid password');
            loginWithoutRedirect(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
            addSession(data.user_id, data.home_server, data.access_token || '', data.refresh_token || '');
            setShowSwitcher(false);
            setPasswordFor(null);
            setSwitchPassword('');
            router.push('/feed');
        } catch (err: any) {
            setSwitchError(err.message || 'Sign in failed');
        } finally {
            setSwitchLoading(false);
        }
    };

    const navIcon = (color = "var(--amber)") => ({ color });

    return (
        <aside
            className={`
                h-full shrink-0 flex flex-col
                glass-sidebar
                transition-all duration-300 ease-in-out
                ${expanded ? "w-64" : "w-20"}
            `}
            style={{ zIndex: 40 }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5">
                <div className="min-w-12 flex justify-center">
                    <GothamLogo />
                </div>
                <span
                    className={`
                        text-lg font-black tracking-widest italic
                        transition-all duration-300
                        ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none absolute"}
                    `}
                    style={{ color: "var(--amber)" }}
                >
                    GOTHAM
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col gap-1 px-3">

                {/* Menu toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-xl transition-all duration-200 group"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)";
                        (e.currentTarget as HTMLElement).style.color = "var(--amber)";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    }}
                >
                    <MenuSvg />
                    <span className={`whitespace-nowrap transition-all duration-300 text-sm font-medium ${expanded ? "opacity-100" : "opacity-0 -translate-x-2.5 hidden"}`}>
                        Menu
                    </span>
                </button>

                <SideNavItem label="Home" href="/explore" expanded={expanded} active={pathname.startsWith("/explore")}>
                    <Home_svg />
                </SideNavItem>

                <SideNavItem label="Search" href="/search" expanded={expanded} active={pathname.startsWith("/search")}>
                    <Search_svg />
                </SideNavItem>

                <SideNavItem label="Trends" href="/trends" expanded={expanded} active={pathname.startsWith("/trends")}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                    </svg>
                </SideNavItem>

                <div className="relative">
                    <SideNavItem label="Notifications" href="/notifications" expanded={expanded} active={pathname.startsWith("/notifications")}>
                        <NotifSvg />
                    </SideNavItem>
                    {unreadCount > 0 && (
                        <span
                            className="absolute top-1.5 left-7 min-w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 pointer-events-none z-20 animate-scale-in"
                            style={{ background: "var(--amber)" }}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>

                <SideNavItem label="Messages" href="/messages" expanded={expanded} active={pathname.startsWith("/messages")}>
                    <Message_svg />
                </SideNavItem>

                <SideNavItem label="Groups" href="/groups" expanded={expanded} active={pathname.startsWith("/groups")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </SideNavItem>

                {/* Divider */}
                <div className="h-px mx-2 my-2" style={{ background: "var(--border)" }} />

                <SideNavItem label="Profile" href="/profile" expanded={expanded} active={pathname.startsWith("/profile")}>
                    <Profile_svg />
                </SideNavItem>

                <SideNavItem label="Followers" href="/followers" expanded={expanded} active={pathname.startsWith("/followers")}>
                    <Community_svg />
                </SideNavItem>

                <SideNavItem label="Following" href="/following" expanded={expanded} active={pathname.startsWith("/following")}>
                    <Follow_svg />
                </SideNavItem>

                <SideNavItem label="Linked" href="/linked-accounts" expanded={expanded} active={pathname.startsWith("/linked-accounts")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </SideNavItem>

                <SideNavItem label="Close Friends" href="/close-friends" expanded={expanded} active={pathname.startsWith("/close-friends")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: "#0F766E" }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </SideNavItem>

                {/* Post button */}
                <div className="mt-auto mb-4">
                    <Link
                        href="/compose"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 group"
                        style={{
                            background: pathname.startsWith("/compose") ? "var(--amber)" : "linear-gradient(135deg, var(--amber-light), var(--amber))",
                            color: "#fff",
                            boxShadow: "0 2px 10px var(--amber-glow)",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px var(--amber-glow)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px var(--amber-glow)"; }}
                    >
                        <div className="min-w-[1.25rem] flex justify-center">
                            <PostSvg />
                        </div>
                        {expanded && <span>New Post</span>}
                    </Link>
                </div>
            </nav>

            {/* Footer — account section */}
            <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
                {/* Social quick-links */}
                <div className={`flex mb-3 gap-1 ${expanded ? "justify-start px-1" : "justify-center"}`}>
                    {[
                        { href: "https://github.com", title: "GitHub", path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
                        { href: "https://x.com", title: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                        { href: "/feed", title: "Feed", path: "M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" },
                    ].map(({ href, title, path }) => (
                        <a
                            key={href}
                            href={href}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            title={title}
                            className="p-1.5 rounded-lg transition-all duration-200"
                            style={{ color: "var(--text-ghost)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                        >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                                <path d={path} />
                            </svg>
                        </a>
                    ))}
                </div>

                {!identity ? (
                    <div className={`flex flex-col gap-2 ${!expanded ? "items-center" : ""}`}>
                        <Link
                            href="/login"
                            className={`px-4 py-2 rounded-xl text-sm font-bold text-center text-white transition-all duration-200 ${!expanded ? "w-10 h-10 p-0 flex items-center justify-center" : "w-full"}`}
                            style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))", boxShadow: "0 2px 10px var(--amber-glow)" }}
                        >
                            {expanded ? "Sign in" : "In"}
                        </Link>
                        <Link
                            href="/register"
                            className={`px-4 py-2 rounded-xl text-sm font-bold text-center transition-all duration-200 ${!expanded ? "w-10 h-10 p-0 flex items-center justify-center" : "w-full"}`}
                            style={{ border: "1.5px solid var(--border-lit)", color: "var(--text-dim)", background: "transparent" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--amber)"; (e.currentTarget as HTMLElement).style.color = "var(--amber)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-lit)"; (e.currentTarget as HTMLElement).style.color = "var(--text-dim)"; }}
                        >
                            {expanded ? "Create Account" : "Up"}
                        </Link>
                    </div>
                ) : (
                    <div className="relative">
                        <button
                            onClick={() => { if (expanded) { setShowSwitcher(s => !s); setPasswordFor(null); setSwitchError(''); } }}
                            className="flex items-center gap-3 w-full rounded-xl p-2 transition-all duration-200 group"
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                        >
                            <div
                                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm text-white"
                                style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))", boxShadow: "0 2px 8px var(--amber-glow)" }}
                            >
                                {identity.user_id.substring(0, 2).toUpperCase()}
                            </div>
                            {expanded && (
                                <>
                                    <div className="flex flex-col overflow-hidden min-w-0 text-left">
                                        <span className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{identity.user_id.split('@')[0]}</span>
                                        <span className="text-xs truncate" style={{ color: "var(--text-ghost)" }}>{identity.user_id}</span>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className={`w-4 h-4 ml-auto shrink-0 transition-all duration-200 ${showSwitcher ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        style={{ color: "var(--text-ghost)" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {!expanded && (
                            <button onClick={logout} title="Sign out"
                                className="mt-1 w-full flex justify-center p-1.5 rounded-lg transition-all duration-200"
                                style={{ color: "var(--text-ghost)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--rose)"; (e.currentTarget as HTMLElement).style.background = "rgba(194,65,12,0.07)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}

                        {/* Account switcher dropdown */}
                        {expanded && showSwitcher && (
                            <div
                                className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden z-50 animate-slide-up"
                                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}
                            >
                                {sessions.filter(s => s.user_id !== identity.user_id).map(session => (
                                    <div key={session.user_id} style={{ borderBottom: "1px solid var(--border)" }} className="last:border-0">
                                        {passwordFor === session.user_id ? (
                                            <div className="p-3">
                                                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                                                    Password for <span className="font-semibold" style={{ color: "var(--text)" }}>{session.user_id.split('@')[0]}</span>
                                                </p>
                                                <input
                                                    type="password"
                                                    value={switchPassword}
                                                    onChange={e => setSwitchPassword(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handlePasswordSwitch(session); }}
                                                    placeholder="Password"
                                                    autoFocus
                                                    className="input-light text-sm"
                                                />
                                                {switchError && <p className="text-xs mt-1" style={{ color: "var(--rose)" }}>{switchError}</p>}
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => handlePasswordSwitch(session)} disabled={switchLoading || !switchPassword}
                                                        className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                                                        style={{ background: "var(--amber)" }}>
                                                        {switchLoading ? '…' : 'Sign in'}
                                                    </button>
                                                    <button onClick={() => { setPasswordFor(null); setSwitchPassword(''); setSwitchError(''); }}
                                                        className="flex-1 py-1.5 rounded-lg text-xs"
                                                        style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <button onClick={() => handleSwitchTo(session)} disabled={switchingTo === session.user_id}
                                                    className="flex items-center gap-3 flex-1 px-4 py-3 transition-colors disabled:opacity-60 group"
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                                                    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--amber)" }}>
                                                        {session.user_id.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col text-left min-w-0">
                                                        <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{session.user_id.split('@')[0]}</span>
                                                        <span className="text-xs truncate" style={{ color: "var(--text-ghost)" }}>{session.user_id}</span>
                                                    </div>
                                                    {switchingTo === session.user_id && (
                                                        <span className="ml-auto text-xs animate-pulse" style={{ color: "var(--amber)" }}>switching…</span>
                                                    )}
                                                </button>
                                                <button onClick={() => removeSession(session.user_id)} title="Remove"
                                                    className="px-3 py-3 shrink-0 transition-colors"
                                                    style={{ color: "var(--text-ghost)" }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--rose)"}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <Link href="/add-account" onClick={() => setShowSwitcher(false)}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                                    style={{ borderTop: "1px solid var(--border)", color: "var(--amber)" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                                    <div className="w-8 h-8 shrink-0 rounded-full border flex items-center justify-center" style={{ borderColor: "var(--amber)" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium">Add another account</span>
                                </Link>

                                <button onClick={logout}
                                    className="flex items-center gap-3 w-full px-4 py-3 transition-colors"
                                    style={{ borderTop: "1px solid var(--border)", color: "var(--rose)" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(194,65,12,0.06)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                                    <div className="w-8 h-8 shrink-0 rounded-full border flex items-center justify-center" style={{ borderColor: "rgba(194,65,12,0.25)" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <span className="text-sm">Sign out</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

/** Individual nav item styled for the light sidebar */
function SideNavItem({ label, href, expanded, active, children }: {
    label: string; href: string; expanded: boolean; active: boolean; children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
            style={{
                background: active ? "var(--amber-faint)" : "transparent",
                color: active ? "var(--amber)" : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
                borderLeft: active ? "3px solid var(--amber)" : "3px solid transparent",
            }}
            onMouseEnter={e => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text)";
                    (e.currentTarget as HTMLElement).style.transform = "translateX(3px)";
                }
            }}
            onMouseLeave={e => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.transform = "";
                }
            }}
        >
            <div className="min-w-[1.25rem] flex justify-center">{children}</div>
            {expanded && (
                <span className="text-sm whitespace-nowrap">{label}</span>
            )}
            {/* Active dot when collapsed */}
            {!expanded && active && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--amber)" }} />
            )}
        </Link>
    );
}
