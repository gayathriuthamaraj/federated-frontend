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
import Bookmark_svg from "../icons/bookmark_svg";


function BatLogo() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-bat-yellow">
            <path d="M2.5 12C2.5 12 5 12 5 12C5 12 3.5 8 7 5C9 8 10 9 12 9C14 9 15 8 17 5C20.5 8 19 12 19 12C19 12 21.5 12 21.5 12C21.5 12 21.5 16 17 17C15 18 12 20 12 20C12 20 9 18 7 17C2.5 16 2.5 12 2.5 12Z" fill="currentColor" />
        </svg>
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

    // Poll for unread notifications every 30 s; reset badge when on the notifications page
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

    // Clear the badge when the user navigates to the notifications page
    useEffect(() => {
        if (pathname.startsWith('/notifications')) setUnreadCount(0);
    }, [pathname]);

    // Try linked switch first; if no confirmed link exists, fall back to password form
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

    // Password-based switch when no confirmed link exists
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

    return (
        <aside
            className={`
        h-full shrink-0
        ${expanded ? "w-64" : "w-20"}
        flex flex-col
        bg-bat-black
        border-r border-bat-yellow/10
        transition-all duration-300 ease-in-out
        shadow-[2px_0_10px_rgba(0,0,0,0.5)]
      `}
        >
            {}
            <div className="flex items-center gap-3 px-4 py-6">
                <div className="min-w-12 flex justify-center">
                    <BatLogo />
                </div>
                <span
                    className={`
            text-xl font-bold tracking-wider text-bat-yellow italic
            transition-all duration-300
            ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none absolute"}
          `}
                >
                    GOTHAM
                </span>
            </div>

            {}
            <nav className="flex-1 flex flex-col gap-2 px-3">

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="
            flex items-center gap-3 px-3 py-3 mb-4
            rounded-md
            text-bat-gray
            hover:text-bat-yellow
            hover:bg-bat-yellow/10
            transition-all duration-200
            group
          "
                >
                    <MenuSvg />
                    <span
                        className={`
                whitespace-nowrap transition-all duration-300
                ${expanded ? "opacity-100" : "opacity-0 -translate-x-2.5 hidden"}
            `}
                    >
                        Menu
                    </span>
                </button>

                {}
                <NavItem label="Home" href="/explore" expanded={expanded} active={pathname.startsWith("/explore")}>
                    <Home_svg />
                </NavItem>

                <NavItem
                    label="Search"
                    href="/search"
                    expanded={expanded}
                    active={pathname.startsWith("/search")}
                >
                    <Search_svg />
                </NavItem>

                <NavItem
                    label="Trends"
                    href="/trends"
                    expanded={expanded}
                    active={pathname.startsWith("/trends")}
                >
                    {/* Trending/chart-up icon */}
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-bat-yellow">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                    </svg>
                </NavItem>

                <div className="relative">
                    <NavItem
                        label="Notifications"
                        href="/notifications"
                        expanded={expanded}
                        active={pathname.startsWith("/notifications")}
                    >
                        <NotifSvg />
                    </NavItem>
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 left-7 min-w-4 h-4 rounded-full bg-bat-yellow text-bat-black text-[9px] font-bold flex items-center justify-center px-0.5 pointer-events-none z-20">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>

                <NavItem
                    label="Messages"
                    href="/messages"
                    expanded={expanded}
                    active={pathname.startsWith("/messages")}
                >
                    <Message_svg />
                </NavItem>

                <NavItem
                    label="Groups"
                    href="/groups"
                    expanded={expanded}
                    active={pathname.startsWith("/groups")}
                >
                    {/* People / group icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-6 h-6 stroke-bat-yellow">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </NavItem>

                {}
                <div className="h-px bg-bat-gray/20 my-2"></div>

                {}
                <NavItem
                    label="Profile"
                    href="/profile"
                    expanded={expanded}
                    active={pathname.startsWith("/profile")}
                >
                    <Profile_svg />
                </NavItem>

                <NavItem
                    label="Followers"
                    href="/followers"
                    expanded={expanded}
                    active={pathname.startsWith("/followers")}
                >
                    <Community_svg />
                </NavItem>

                <NavItem
                    label="Following"
                    href="/following"
                    expanded={expanded}
                    active={pathname.startsWith("/following")}
                >
                    <Follow_svg />
                </NavItem>

                <NavItem
                    label="Linked"
                    href="/linked-accounts"
                    expanded={expanded}
                    active={pathname.startsWith("/linked-accounts")}
                >
                    {/* Chain-link icon — stroke-bat-yellow mirrors the Follow_svg pattern */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-6 h-6 stroke-bat-yellow">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </NavItem>

                {}
                <div className="mt-auto mb-4">
                    <NavItem
                        label="Post"
                        href="/compose"
                        expanded={expanded}
                        active={pathname.startsWith("/compose")}
                        variant="post"
                    >
                        <PostSvg />
                    </NavItem>
                </div>

            </nav>

            {}
            <div className="p-4 border-t border-bat-gray/10 bg-bat-dark/20">

                {/* Social / fediverse quick-links */}
                <div className={`flex mb-4 gap-2 ${expanded ? "justify-start px-1" : "justify-center"}`}>
                    {/* GitHub */}
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub"
                        className="p-1.5 rounded-md text-bat-gray/50 hover:text-bat-yellow hover:bg-bat-yellow/10 transition-all duration-200"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                        </svg>
                    </a>
                    {/* X / Twitter */}
                    <a
                        href="https://x.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="X (Twitter)"
                        className="p-1.5 rounded-md text-bat-gray/50 hover:text-bat-yellow hover:bg-bat-yellow/10 transition-all duration-200"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>
                    {/* RSS / Feed */}
                    <a
                        href="/feed"
                        title="Your feed"
                        className="p-1.5 rounded-md text-bat-gray/50 hover:text-bat-yellow hover:bg-bat-yellow/10 transition-all duration-200"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
                        </svg>
                    </a>
                </div>

                {!identity ? (
                    <div className={`flex flex-col gap-3 ${!expanded ? "items-center" : ""}`}>
                        <Link
                            href="/login"
                            className={`
                        px-4 py-2 rounded-md text-sm font-bold text-center
                        bg-bat-yellow text-bat-black
                        hover:bg-yellow-400
                        transition-colors
                        ${!expanded ? "w-10 h-10 p-0 flex items-center justify-center overflow-hidden text-[10px]" : "w-full"}
                    `}
                        >
                            {expanded ? "Sign in" : "In"}
                        </Link>
                        <Link
                            href="/register"
                            className={`
                        px-4 py-2 rounded-md text-sm font-bold text-center
                        border border-bat-gray text-bat-gray
                        hover:text-white hover:border-white
                        transition-colors
                        ${!expanded ? "w-10 h-10 p-0 flex items-center justify-center overflow-hidden text-[10px]" : "w-full"}
                    `}
                        >
                            {expanded ? "Create Account" : "Up"}
                        </Link>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Current account row — click to open switcher when expanded */}
                        <button
                            onClick={() => { if (expanded) { setShowSwitcher(s => !s); setPasswordFor(null); setSwitchError(''); } }}
                            className="flex items-center gap-3 w-full rounded-lg p-1 hover:bg-bat-yellow/10 transition-colors group"
                        >
                            <div className="w-10 h-10 shrink-0 rounded-full bg-bat-gray/20 flex items-center justify-center text-bat-yellow font-bold text-lg">
                                {identity.user_id.substring(0, 2).toUpperCase()}
                            </div>
                            {expanded && (
                                <>
                                    <div className="flex flex-col overflow-hidden min-w-0 text-left">
                                        <span className="text-sm font-bold text-bat-gray truncate">{identity.user_id.split('@')[0]}</span>
                                        <span className="text-xs text-bat-gray/60 truncate">{identity.user_id}</span>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className={`w-4 h-4 ml-auto shrink-0 text-bat-gray/40 group-hover:text-bat-yellow transition-transform duration-200 ${showSwitcher ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {/* Collapsed: small sign-out button */}
                        {!expanded && (
                            <button onClick={logout} title="Sign out"
                                className="mt-2 w-full flex justify-center p-1 text-bat-gray/40 hover:text-bat-yellow transition-colors rounded-md hover:bg-bat-yellow/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}

                        {/* Account switcher dropdown */}
                        {expanded && showSwitcher && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-bat-gray/20 bg-bat-dark shadow-2xl overflow-hidden z-50">

                                {/* Other saved sessions */}
                                {sessions.filter(s => s.user_id !== identity.user_id).map(session => (
                                    <div key={session.user_id} className="border-b border-bat-gray/10 last:border-0">
                                        {passwordFor === session.user_id ? (
                                            /* Inline password form for non-linked accounts */
                                            <div className="p-3">
                                                <p className="text-xs text-bat-gray/70 mb-2">
                                                    Password for <span className="font-semibold text-bat-gray">{session.user_id.split('@')[0]}</span>
                                                </p>
                                                <input
                                                    type="password"
                                                    value={switchPassword}
                                                    onChange={e => setSwitchPassword(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handlePasswordSwitch(session); }}
                                                    placeholder="Password"
                                                    autoFocus
                                                    className="w-full px-3 py-1.5 rounded-lg bg-bat-black border border-bat-gray/20 text-bat-gray text-sm focus:border-bat-yellow/50 focus:outline-none"
                                                />
                                                {switchError && <p className="text-red-400 text-xs mt-1">{switchError}</p>}
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handlePasswordSwitch(session)}
                                                        disabled={switchLoading || !switchPassword}
                                                        className="flex-1 py-1.5 rounded-lg bg-bat-yellow text-bat-black text-xs font-bold disabled:opacity-40 transition-opacity"
                                                    >
                                                        {switchLoading ? '…' : 'Sign in'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setPasswordFor(null); setSwitchPassword(''); setSwitchError(''); }}
                                                        className="flex-1 py-1.5 rounded-lg border border-bat-gray/20 text-bat-gray text-xs hover:border-bat-gray/40 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Session row — linked accounts switch instantly */
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleSwitchTo(session)}
                                                    disabled={switchingTo === session.user_id}
                                                    className="flex items-center gap-3 flex-1 px-4 py-3 hover:bg-bat-yellow/10 transition-colors disabled:opacity-60 group"
                                                >
                                                    <div className="w-8 h-8 shrink-0 rounded-full bg-bat-gray/20 flex items-center justify-center text-bat-yellow text-sm font-bold">
                                                        {session.user_id.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col text-left min-w-0">
                                                        <span className="text-sm text-bat-gray font-medium truncate">{session.user_id.split('@')[0]}</span>
                                                        <span className="text-xs text-bat-gray/50 truncate">{session.user_id}</span>
                                                    </div>
                                                    {switchingTo === session.user_id ? (
                                                        <span className="ml-auto text-xs text-bat-yellow animate-pulse">switching…</span>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto text-bat-gray/30 group-hover:text-bat-yellow transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                    )}
                                                </button>
                                                {/* Remove session from list */}
                                                <button
                                                    onClick={() => removeSession(session.user_id)}
                                                    title="Remove from list"
                                                    className="px-3 py-3 text-bat-gray/30 hover:text-red-400 transition-colors shrink-0"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add another account */}
                                <Link
                                    href="/add-account"
                                    onClick={() => setShowSwitcher(false)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-bat-yellow/10 transition-colors text-bat-yellow/70 hover:text-bat-yellow border-t border-bat-gray/10"
                                >
                                    <div className="w-8 h-8 shrink-0 rounded-full border border-bat-yellow/30 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="text-sm">Add another account</span>
                                </Link>

                                {/* Sign out */}
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/10 transition-colors text-red-400/70 hover:text-red-400 border-t border-bat-gray/10"
                                >
                                    <div className="w-8 h-8 shrink-0 rounded-full border border-red-400/20 flex items-center justify-center">
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
