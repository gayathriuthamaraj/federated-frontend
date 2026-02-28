'use client'

import { Profile } from '@/types/profile'
import FollowButton from './FollowButton'
import Link from 'next/link'

interface FollowingProps {
    following: Profile[]
}

export default function Following({ following }: FollowingProps) {
    if (following.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-bat-gray/40 text-sm">Target is not following anyone yet.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            {following.map((followedUser) => (
                <div
                    key={followedUser.user_id}
                    className="
                        group flex items-center justify-between
                        px-4 py-3
                        border-b border-bat-dark
                        hover:bg-bat-dark/20
                        transition-colors
                    "
                >
                    <Link
                        href={`/search?user_id=${encodeURIComponent(followedUser.user_id)}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                    >
                        {}
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-bat-black border border-bat-dark overflow-hidden flex items-center justify-center">
                                {followedUser.avatar_url ? (
                                    <img
                                        src={followedUser.avatar_url}
                                        alt={followedUser.user_id}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-bat-yellow font-bold text-lg select-none">
                                        {(followedUser.display_name || followedUser.user_id)[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {}
                        <div className="flex flex-col min-w-0">
                            <div className="font-bold text-bat-gray truncate text-[15px] group-hover:underline decoration-bat-gray/50">
                                {followedUser.display_name}
                            </div>
                            <div className="text-bat-gray/50 text-sm truncate">
                                {followedUser.user_id}
                            </div>
                        </div>
                    </Link>

                    {}
                    <div className="ml-4 flex-shrink-0">
                        {}
                        <FollowButton targetUser={followedUser.user_id} />
                    </div>
                </div>
            ))}
        </div>
    )
}
