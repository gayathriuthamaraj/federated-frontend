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
            className={`
                flex gap-3 px-4 py-3 border-b border-bat-dark 
                hover:bg-bat-dark/20 transition-colors
                ${onClick ? 'cursor-pointer' : 'cursor-default'}
            `}
        >
            {}
            <div className="flex-shrink-0">
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="h-12 w-12 rounded-full"
                    />
                ) : (
                    <div className="h-12 w-12 rounded-full bg-bat-dark border border-bat-yellow/50 flex items-center justify-center text-bat-yellow font-bold text-lg">
                        {user.displayName[0].toUpperCase()}
                    </div>
                )}
            </div>

            {}
            <div className="flex-1 min-w-0">
                {}
                <div className="flex items-baseline gap-1.5 text-[15px] leading-5">
                    <span className="font-bold text-gray-200 truncate">
                        {user.displayName}
                    </span>
                    <span className="text-bat-gray/60 truncate">
                        @{user.username}
                    </span>
                </div>

                {}
                {user.bio && (
                    <div className="mt-1 text-[15px] text-bat-gray leading-normal line-clamp-2">
                        {user.bio}
                    </div>
                )}

                {}
                {((followersCount || 0) > 0 || (followingCount || 0) > 0) && (
                    <div className="mt-2 flex gap-4 text-sm">
                        <div>
                            <span className="font-bold text-bat-gray mr-1">
                                {followersCount?.toLocaleString() || 0}
                            </span>
                            <span className="text-bat-gray/60">Followers</span>
                        </div>
                        <div>
                            <span className="font-bold text-bat-gray mr-1">
                                {followingCount?.toLocaleString() || 0}
                            </span>
                            <span className="text-bat-gray/60">Following</span>
                        </div>
                    </div>
                )}
            </div>

            {}
            {showFollowButton && (
                <div
                    className="flex-shrink-0 flex items-start pt-1"
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
