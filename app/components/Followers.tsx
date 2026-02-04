'use client'

import { Profile } from '@/types/profile'
import FollowButton from './FollowButton'
import Link from 'next/link'

interface FollowersProps {
    followers: Profile[]
}

export default function Followers({ followers }: FollowersProps) {
    if (followers.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-bat-gray/40 text-sm">Target has no followers yet.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            {followers.map((follower) => (
                <div
                    key={follower.user_id}
                    className="
                        group flex items-center justify-between
                        px-4 py-3
                        border-b border-bat-dark
                        hover:bg-bat-dark/20
                        transition-colors
                    "
                >
                    <Link
                        href={`/profile?user_id=${encodeURIComponent(follower.user_id)}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                    >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-bat-black border border-bat-dark overflow-hidden flex items-center justify-center">
                                {follower.avatar_url ? (
                                    <img
                                        src={follower.avatar_url}
                                        alt={follower.user_id}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-bat-yellow font-bold text-lg select-none">
                                        {(follower.display_name || follower.user_id)[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Name & Handle */}
                        <div className="flex flex-col min-w-0">
                            <div className="font-bold text-bat-gray truncate text-[15px] group-hover:underline decoration-bat-gray/50">
                                {follower.display_name}
                            </div>
                            <div className="text-bat-gray/50 text-sm truncate">
                                {follower.user_id}
                            </div>
                        </div>
                    </Link>

                    {/* Action */}
                    <div className="ml-4 flex-shrink-0">
                        {/* Using a simplified/compact FollowButton usage or wrapper if needed, 
                            but our current FollowButton is quite robust. */}
                        <FollowButton targetUser={follower.user_id} />
                    </div>
                </div>
            ))}
        </div>
    )
}
