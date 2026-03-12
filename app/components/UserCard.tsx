"use client";

import { MockUser } from '../data/mockData';
import FollowButton from './FollowButton';

interface UserCardProps {
    user: MockUser | {
        userId: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        bio: string;
        followersCount?: number;
        followingCount?: number;
    };
    showFollowButton?: boolean;
    onClick?: () => void;
}

export default function UserCard({ user, showFollowButton = true, onClick }: UserCardProps) {
    const followersCount = 'followersCount' in user ? user.followersCount : 0;
    const followingCount = 'followingCount' in user ? user.followingCount : 0;

    return (
        <article
            onClick={onClick}
            className={`flex gap-3 px-4 py-3 transition-all duration-150 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
            onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)"; }}
        >
            <div className="shrink-0">
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))" }}
                    >
                        {(user.displayName?.[0] ?? user.username?.[0] ?? '?').toUpperCase()}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 text-[15px] leading-5">
                    <span className="font-bold truncate" style={{ color: "var(--text)" }}>
                        {user.displayName}
                    </span>
                    <span className="truncate text-sm" style={{ color: "var(--text-muted)" }}>
                        @{user.username}
                    </span>
                </div>

                {user.bio && (
                    <div className="mt-1 text-[14px] leading-normal line-clamp-2" style={{ color: "var(--text-dim)" }}>
                        {user.bio}
                    </div>
                )}

                {((followersCount || 0) > 0 || (followingCount || 0) > 0) && (
                    <div className="mt-2 flex gap-4 text-sm">
                        <div>
                            <span className="font-bold mr-1" style={{ color: "var(--text)" }}>
                                {followersCount?.toLocaleString() || 0}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>Followers</span>
                        </div>
                        <div>
                            <span className="font-bold mr-1" style={{ color: "var(--text)" }}>
                                {followingCount?.toLocaleString() || 0}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>Following</span>
                        </div>
                    </div>
                )}
            </div>

            {showFollowButton && (
                <div
                    className="shrink-0 flex items-start pt-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FollowButton
                        targetUser={user.username}
                        onSuccess={() => console.log(`Followed ${user.username}`)}
                    />
                </div>
            )}
        </article>
    );
}
