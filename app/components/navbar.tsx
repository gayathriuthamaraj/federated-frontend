"use client";

import { useState } from 'react';
import Bookmark_svg from "../icons/bookmark_svg"
import Community_svg from "../icons/community_svg"
import Follow_svg from "../icons/follow_svg"
import Home_svg from "../icons/home_svg"
import Message_svg from "../icons/message_svg"
import More_svg from "../icons/more_svg"
import Notif_svg from "../icons/notif_svg"
import Profile_svg from "../icons/profile_svg"
import Search_svg from "../icons/search_svg"

export default function Navbar() {
    return (
        <div className="bg-black inline-flex flex-col">
            <Home_svg/>
            <Search_svg/>
            <Notif_svg/>
            <Follow_svg/>
            <Message_svg/>
            <Bookmark_svg/>
            <Community_svg/>
            <Profile_svg/>
            <More_svg/>
        </div>
    )
}