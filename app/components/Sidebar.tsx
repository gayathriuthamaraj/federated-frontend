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
