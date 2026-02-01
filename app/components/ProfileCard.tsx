'use client'

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
}

// ProfileCard.tsx
export default function ProfileCard({ profile, isOwnProfile = false, posts = [], loadingPosts = false }: ProfileCardProps) {
    return (
        <div className="w-full bg-bat-black min-h-screen flex flex-col">

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

                    {/* Edit Profile or Follow Button */}
                    <div className="pt-3">
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
                            <FollowButton targetUser={profile.user_id} />
                        )}
                    </div>
                </div>

                {/* Identity Block */}
                <div className="mt-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-bat-gray leading-tight">
                        {profile.display_name}
                    </h1>
                    <p className="text-bat-gray/60 text-sm sm:text-base">
                        @{profile.user_id}
                    </p>
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
                        <span className="flex items-center gap-1">
                            📍 {profile.location}
                        </span>
                    )}

                    {profile.portfolio_url && (
                        <a
                            href={profile.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-bat-blue hover:underline"
                        >
                            🔗 <span className="truncate max-w-[200px]">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}

                    <span className="flex items-center gap-1">
                        🗓 Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
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
