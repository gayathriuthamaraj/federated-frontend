"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { NavItem } from "./navItem";
import { useAuth } from "../context/AuthContext";

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
    const pathname = usePathname();

    const { identity, logout } = useAuth();

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
                <div className="min-w-[48px] flex justify-center">
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
                ${expanded ? "opacity-100" : "opacity-0 translate-x-[-10px] hidden"}
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
                    label="Notifications"
                    href="/notifications"
                    expanded={expanded}
                    active={pathname.startsWith("/notifications")}
                >
                    <NotifSvg />
                </NavItem>

                <NavItem
                    label="Messages"
                    href="/messages"
                    expanded={expanded}
                    active={pathname.startsWith("/messages")}
                >
                    <Message_svg />
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
                    {/* Fediverse / ActivityPub */}
                    <a
                        href="https://joinmastodon.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Fediverse / Mastodon"
                        className="p-1.5 rounded-md text-bat-gray/50 hover:text-bat-yellow hover:bg-bat-yellow/10 transition-all duration-200"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                            <path d="M23.193 7.88c-.33-2.335-2.45-4.18-4.93-4.56-2.12-.33-4.25-.5-6.37-.5-2.12 0-4.25.17-6.37.5C3.04 3.71.92 5.55.6 7.88c-.26 1.84-.4 3.69-.4 5.54 0 1.85.14 3.7.4 5.54.33 2.35 2.45 4.18 4.93 4.56 2.12.33 4.25.5 6.37.5 2.12 0 4.25-.17 6.37-.5 2.48-.38 4.6-2.21 4.93-4.56.26-1.84.4-3.69.4-5.54 0-1.85-.14-3.7-.4-5.54zM12 16.97c-1.12 0-2.21-.08-3.27-.24-1.04-.16-1.97-.52-2.7-1.06-.73-.54-1.19-1.28-1.19-2.12 0-.83.46-1.58 1.19-2.12.73-.54 1.66-.9 2.7-1.06 1.06-.16 2.15-.24 3.27-.24 1.12 0 2.21.08 3.27.24 1.04.16 1.97.52 2.7 1.06.73.54 1.19 1.29 1.19 2.12 0 .84-.46 1.58-1.19 2.12-.73.54-1.66.9-2.7 1.06-1.06.16-2.15.24-3.27.24z"/>
                        </svg>
                    </a>
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
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bat-gray/20 flex items-center justify-center text-bat-yellow font-bold text-lg">
                            {identity.user_id.substring(0, 2).toUpperCase()}
                        </div>
                        {expanded && (
                            <div className="flex flex-col overflow-hidden min-w-0">
                                <span className="text-sm font-bold text-bat-gray truncate" title={identity.user_id}>
                                    {identity.user_id.split('@')[0]}
                                </span>
                                <span className="text-xs text-bat-gray/60 truncate" title={identity.home_server}>
                                    {identity.user_id}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-xs text-bat-yellow hover:underline text-left mt-1"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
