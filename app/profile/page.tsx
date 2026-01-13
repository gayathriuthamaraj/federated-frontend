"use client";

import Image from "next/image";
import { Tab } from "./tab";
import { Post } from "./post";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-bat-black text-bat-gray">
      {/* Cover */}
      <div className="h-44 bg-linear-to-b from-bat-dark to-bat-black border-b border-bat-yellow/10" />

      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="relative -mt-14 flex items-start justify-between">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative h-28 w-28 rounded-full border-4 border-bat-black overflow-hidden bg-bat-dark">
              <Image
                src="/avatar-placeholder.png"
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>

            {/* Identity */}
            <div className="pt-14">
              <h1 className="text-xl font-semibold text-bat-yellow">
                Bruce Wayne
              </h1>
              <p className="text-sm text-bat-gray/60">
                @bruce@gotham.social
              </p>
            </div>
          </div>

          {/* Edit Button */}
          <button
            className="
              mt-16 px-4 py-1.5 rounded-full
              text-sm font-medium
              text-bat-blue
              border border-bat-blue/40
              hover:bg-bat-blue/10
              transition
            "
          >
            Edit profile
          </button>
        </div>

        {/* Bio */}
        <p className="mt-4 text-sm leading-relaxed text-bat-gray/90">
          Operating quietly. Watching systems. Building infrastructure that
          doesn’t flinch under pressure.
        </p>

        {/* Meta */}
        <div className="mt-2 flex gap-4 text-xs text-bat-gray/60">
          <span>📍 Gotham</span>
          <span>Joined Oct 2025</span>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-sm">
          <span>
            <span className="font-semibold text-bat-yellow">128</span>{" "}
            <span className="text-bat-gray/60">Posts</span>
          </span>
          <span>
            <span className="font-semibold text-bat-yellow">3.2K</span>{" "}
            <span className="text-bat-gray/60">Followers</span>
          </span>
          <span>
            <span className="font-semibold text-bat-yellow">42</span>{" "}
            <span className="text-bat-gray/60">Following</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-6 border-b border-bat-yellow/10 text-sm">
          <Tab active>Posts</Tab>
          <Tab>Replies</Tab>
          <Tab>Media</Tab>
          <Tab>Likes</Tab>
        </div>

        {/* Timeline */}
        <div className="divide-y divide-bat-yellow/10">
          <Post />
          <Post />
          <Post />
        </div>
      </div>
    </div>
  );
}
