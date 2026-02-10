'use client'

// ProfileCard.tsx
import { useState, useEffect } from 'react'
import FollowButton from './FollowButton'
import PostCard from './PostCard'
import { Profile } from '@/types/profile'
import { Post } from '@/types/post'
import Link from 'next/link'

interface ProfileCardProps {
    profile: Profile;
    isOwnProfile?: boolean;
    posts?: Post[];
    loadingPosts?: boolean;
    did?: string;
}

export default function ProfileCard({ profile: initialProfile, isOwnProfile = false, posts = [], loadingPosts = false, did }: ProfileCardProps) {
    const [profile, setProfile] = useState(initialProfile)

    // Sync state if prop changes (e.g. navigation)
    useEffect(() => {
        setProfile(initialProfile)
    }, [initialProfile])

    const handleFollowSuccess = () => {
        // Optimistically update follower count
        setProfile(prev => ({
            ...prev,
            followers_count: (prev.followers_count || 0) + 1
        }))
    }

    return (
        <div className="w-full bg-bat-black flex flex-col">

            {/* Banner */}
            <div className="relative h-48 sm:h-64 w-full bg-bat-dark">
                {profile.banner_url ? (
                    <img
                        src={profile.banner_url}
                        alt="Profile banner"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full bg-bat-dark" />
                )}
            </div>

            {/* Top Section */}
            <div className="px-4 pb-4">
                <div className="relative flex justify-between items-start">
                    {/* Avatar - Negative margin to pull it up */}
                    <div className="-mt-[15%] sm:-mt-16 mb-3">
                        <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full border-4 border-bat-black bg-bat-black overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-bat-dark text-4xl font-bold text-bat-yellow">
                                    {(profile.display_name || profile.user_id)[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Profile or Follow/Message Buttons */}
                    <div className="pt-3 flex gap-2">
                        {isOwnProfile ? (
                            <Link
                                href="/profile/edit"
                                className="
                                    px-6 py-2 rounded-md font-bold
                                    bg-bat-black text-bat-gray
                                    border-2 border-bat-gray/30
                                    hover:border-bat-yellow hover:text-bat-yellow
                                    transition-all duration-200
                                "
                            >
                                Edit Profile
                            </Link>
                        ) : (
                            <>
                                <FollowButton
                                    targetUser={profile.user_id}
                                    onSuccess={handleFollowSuccess}
                                />
                                <Link
                                    href={`/messages?user=${encodeURIComponent(profile.user_id)}`}
                                    className="
                                        px-6 py-2 rounded-md font-bold
                                        bg-bat-black text-bat-gray
                                        border-2 border-bat-gray/30
                                        hover:border-bat-yellow hover:text-bat-yellow
                                        transition-all duration-200
                                    "
                                >
                                    Message
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Identity Block */}
                <div className="mt-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-bat-gray leading-tight">
                        {profile.display_name}
                    </h1>
                    <p className="text-bat-gray/60 text-sm sm:text-base">
                        {profile.user_id}
                    </p>
                    {did && (
                        <p className="text-bat-gray/40 text-xs font-mono mt-1 truncate max-w-md select-all">
                            {did}
                        </p>
                    )}
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="mt-4 text-bat-gray text-[15px] leading-normal whitespace-pre-wrap">
                        {profile.bio}
                    </p>
                )}

                {/* Metadata Row */}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-bat-gray/60">
                    {profile.location && (
                        <span className="flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current text-bat-gray/60">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                            </svg>
                            {profile.location}
                        </span>
                    )}

                    {profile.portfolio_url && (
                        <a
                            href={profile.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-bat-blue hover:underline"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path>
                            </svg>
                            <span className="truncate max-w-[200px]">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}

                    <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current text-bat-gray/60">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"></path>
                        </svg>
                        Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {/* Stats Row */}
                <div className="mt-4 flex gap-5 text-sm">
                    <div className="hover:underline cursor-pointer">
                        <span className="font-bold text-bat-gray mr-1">{profile.following_count ?? 0}</span>
                        <span className="text-bat-gray/60">Following</span>
                    </div>
                    <div className="hover:underline cursor-pointer">
                        <span className="font-bold text-bat-gray mr-1">{profile.followers_count ?? 0}</span>
                        <span className="text-bat-gray/60">Followers</span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-2 flex border-b border-bat-dark">
                {['Posts', 'Replies', 'Highlights', 'Media', 'Likes'].map((tab, i) => (
                    <div
                        key={tab}
                        className={`
                            flex-1 py-4 text-center text-sm sm:text-base font-medium transition-colors cursor-pointer hover:bg-bat-dark/30
                            ${i === 0
                                ? 'text-bat-yellow border-b-[3px] border-bat-yellow'
                                : 'text-bat-gray/60 hover:text-bat-gray'
                            }
                        `}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {/* Feed - Posts Display */}
            <div className="flex-1">
                {loadingPosts ? (
                    <div className="text-center text-bat-gray py-8">Loading posts...</div>
                ) : posts.length === 0 ? (
                    <div className="p-8 text-center border-t border-bat-dark/50">
                        <div className="text-bat-gray/40 text-lg font-medium">No posts yet</div>
                        <div className="text-bat-gray/20 text-sm mt-1">
                            {isOwnProfile ? "Start sharing your thoughts!" : `${profile.display_name} hasn't posted anything yet.`}
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-bat-dark/50">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
