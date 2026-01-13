"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavItem } from "./navItem";

import MenuSvg from "../icons/menu_svg";
import Home_svg from "../icons/home_svg";
import Search_svg from "../icons/search_svg";
import Notif_svg from "../icons/notif_svg";
import Follow_svg from "../icons/follow_svg";
import Message_svg from "../icons/message_svg";
import Bookmark_svg from "../icons/bookmark_svg";
import Community_svg from "../icons/community_svg";
import Profile_svg from "../icons/profile_svg";
import More_svg from "../icons/more_svg";
import PostSvg from "../icons/post_svg";


export default function Navbar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`
        h-screen
        ${expanded ? "w-52" : "w-16"}
        flex flex-col
        bg-bat-black
        border-r border-bat-yellow/10
        transition-all duration-300
      `}
    >
      {/* Top */}
      <div className="flex flex-col gap-2 px-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="
            flex items-center gap-3 px-3 py-2
            rounded-md
            text-bat-gray
            hover:text-bat-yellow
            hover:bg-bat-yellow/10
            transition-all duration-200
          "
        >
          <MenuSvg />
          {expanded && <span className="text-sm">Menu</span>}
        </button>

        <NavItem label="Home" href="/" expanded={expanded} active={pathname === "/"}>
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
          <Notif_svg />
        </NavItem>

        <NavItem
          label="Follow"
          href="/follow"
          expanded={expanded}
          active={pathname.startsWith("/follow")}
        >
          <Follow_svg />
        </NavItem>

        <NavItem
          label="Messages"
          href="/messages"
          expanded={expanded}
          active={pathname.startsWith("/messages")}
        >
          <Message_svg />
        </NavItem>

        <NavItem
          label="Bookmarks"
          href="/bookmarks"
          expanded={expanded}
          active={pathname.startsWith("/bookmarks")}
        >
          <Bookmark_svg />
        </NavItem>

        <NavItem
          label="Communities"
          href="/communities"
          expanded={expanded}
          active={pathname.startsWith("/communities")}
        >
          <Community_svg />
        </NavItem>
      </div>

      <div className="flex-1" />

        <div className="px-2 mb-2">
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


      <div className="flex flex-col gap-2 px-2 pb-3">
        <NavItem
          label="Profile"
          href="/profile"
          expanded={expanded}
          active={pathname.startsWith("/profile")}
        >
          <Profile_svg />
        </NavItem>

        <NavItem
          label="More"
          href="/more"
          expanded={expanded}
          active={pathname.startsWith("/more")}
        >
          <More_svg />
        </NavItem>
      </div>
    </div>
  );
}
