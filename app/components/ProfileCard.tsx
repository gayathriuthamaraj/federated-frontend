'use client'


import { useState, useEffect, useRef } from 'react'
import FollowButton from './FollowButton'
import BlockButton from './BlockButton'
import PostCard from './PostCard'
import { Profile } from '@/types/profile'
import { Post } from '@/types/post'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

interface UserReply {
    id: string;
    post_id: string;
    post_content: string;
    post_author: string;
    content: string;
    created_at: string;
}

export interface LinkedAccountInfo {
    id: string;
    peer_id: string;
    peer_name?: string;
    peer_avatar?: string;
}

export interface Vouch {
    id: string;
    vouching_server_id: string;
    vouching_server_name: string;
    issued_at: string;
}

function VouchBadge({ vouches }: { vouches: Vouch[] }) {
    if (!vouches.length) return null;
    return (
        <div className="mt-3">
            <p className="text-[11px] text-bat-gray/40 uppercase tracking-widest mb-1.5 font-semibold">Vouched by</p>
            <div className="flex flex-wrap gap-1.5">
                {vouches.map(v => (
                    <span
                        key={v.id}
                        title={`Vouched by ${v.vouching_server_id} on ${new Date(v.issued_at).toLocaleDateString()}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                    >
                        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                            <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                        </svg>
                        {v.vouching_server_name || v.vouching_server_id}
                    </span>
                ))}
            </div>
        </div>
    );
}

interface ProfileCardProps {
    profile: Profile;
    isOwnProfile?: boolean;
    isFollowing?: boolean;
    posts?: Post[];
    replies?: UserReply[];
    likedPosts?: Post[];
    highlights?: Post[];
    loadingPosts?: boolean;
    did?: string;
    linkedAccounts?: LinkedAccountInfo[];
    vouches?: Vouch[];
    zkpEnabled?: boolean;
    /** Base path for user-profile links. Defaults to "/profile". Pass "/search" to keep navigation within search. */
    linkBase?: string;
    /** Called after a follow/unfollow with +1 or -1 so parent can update counts & cache */
    onFollowChange?: (delta: 1 | -1) => void;
}

export default function ProfileCard({
    profile: initialProfile,
    isOwnProfile = false,
    isFollowing = false,
    posts = [],
    replies = [],
    likedPosts = [],
    highlights = [],
    loadingPosts = false,
    did,
    linkedAccounts = [],
    vouches = [],
    zkpEnabled = false,
    linkBase = '/search',
    onFollowChange,
}: ProfileCardProps) {
    const [profile, setProfile] = useState(initialProfile)
    const [followingState, setFollowingState] = useState(isFollowing)
    const [activeTab, setActiveTab] = useState(0)
    const [tabAnimKey, setTabAnimKey] = useState(0)
    const router = useRouter()
    const { identity, switchToLinked } = useAuth()

    // Accent colour: bat-blue for moderators, bat-yellow for everyone else
    const isMod = !!profile.is_moderator

    // Touch swipe support
    const touchStartX = useRef<number | null>(null)
    const TABS = ['Posts', 'Replies', 'Highlights', 'Likes'] as const
    const TAB_COUNT = TABS.length

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) {
            setActiveTab(prev => {
                const next = dx < 0
                    ? Math.min(prev + 1, TAB_COUNT - 1)
                    : Math.max(prev - 1, 0);
                setTabAnimKey(k => k + 1);
                return next;
            });
        }
        touchStartX.current = null
    }

    
    // Only hard-reset local state when we switch to a different user.
    // Using the inline profile object reference as a dep would fire on every
    // parent render (new object each time), wiping out optimistic updates.
    useEffect(() => {
        setProfile(initialProfile)
        setFollowingState(isFollowing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialProfile.user_id, isFollowing])

    const handleFollowSuccess = () => {
        const delta: 1 | -1 = followingState ? -1 : 1;
        setProfile(prev => ({
            ...prev,
            followers_count: Math.max(0, (prev.followers_count ?? 0) + delta),
        }));
        setFollowingState(prev => !prev);
        onFollowChange?.(delta);
    }

    return (
        <div className="w-full bg-bat-black flex flex-col">

            {}
            <div className="relative h-48 sm:h-64 w-full bg-bat-dark">
                {profile.banner_url ? (
                    <img
                        src={profile.banner_url}
                        alt="Profile banner"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className={`h-full w-full bg-linear-to-br from-bat-dark via-bat-dark ${isMod ? 'to-bat-blue/10' : 'to-bat-yellow/10'}`} />
                )}
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-linear-to-t from-bat-black/60 to-transparent pointer-events-none" />
            </div>

            {}
            <div className="px-4 pb-4">
                <div className="relative flex justify-between items-start">
                    {}
                    <div className="-mt-[15%] sm:-mt-16 mb-3">
                        <div className={`relative h-32 w-32 sm:h-36 sm:w-36 rounded-full border-4 ${isMod ? 'border-bat-blue/70 shadow-[0_0_14px_rgba(47,128,237,0.4)]' : 'border-bat-black'} bg-bat-black overflow-hidden transition-transform duration-300 hover:scale-105 shadow-lg`}>
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className={`h-full w-full flex items-center justify-center bg-bat-dark text-4xl font-bold ${isMod ? 'text-bat-blue' : 'text-bat-yellow'}`}>
                                    {(profile.display_name || profile.user_id)[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="pt-3 flex gap-2 flex-wrap">
                        {isOwnProfile ? (
                            <>
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
                                <Link
                                    href="/settings/privacy"
                                    className="
                                        px-4 py-2 rounded-md font-bold
                                        bg-bat-black text-bat-gray/60
                                        border-2 border-bat-gray/20
                                        hover:border-bat-yellow/60 hover:text-bat-yellow/80
                                        transition-all duration-200 flex items-center gap-1.5
                                    "
                                    title="Privacy settings"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                                        <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                                    </svg>
                                    Privacy
                                </Link>
                            </>
                        ) : (
                            <>
                                <FollowButton
                                    targetUser={profile.user_id}
                                    isFollowing={followingState}
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
                                <BlockButton
                                    targetUser={profile.user_id}
                                />
                            </>
                        )}
                    </div>
                </div>

                {}
                <div className="mt-2">
                    <h1 className={`text-xl sm:text-2xl font-bold leading-tight ${isMod ? 'text-bat-blue' : 'text-bat-gray'}`}>
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
                    {profile.badge && profile.badge !== 'user' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-2
                            ${isMod
                                ? 'bg-bat-blue/20 text-bat-blue border border-bat-blue/40'
                                : 'bg-bat-yellow/20 text-bat-yellow border border-bat-yellow/40'}`}>
                            {profile.badge}
                        </span>
                    )}
                    {zkpEnabled && (
                        <span
                            title="Identity verified with zero-knowledge proof"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-2 bg-green-500/10 text-green-400 border border-green-500/20"
                        >
                            ZK Verified
                        </span>
                    )}
                </div>

                {}
                {profile.bio && (
                    <p className="mt-4 text-bat-gray text-[15px] leading-normal whitespace-pre-wrap">
                        {profile.bio}
                    </p>
                )}

                <VouchBadge vouches={vouches} />

                {}
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
                            <span className="truncate max-w-50">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}

                    <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current text-bat-gray/60">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"></path>
                        </svg>
                        Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {}
                <div className="mt-4 flex gap-5 text-sm">
                    <Link
                        href={`/following?user_id=${encodeURIComponent(profile.user_id)}`}
                        className="hover:underline cursor-pointer"
                    >
                        <span className="font-bold text-bat-gray mr-1">{profile.following_count ?? 0}</span>
                        <span className="text-bat-gray/60">Following</span>
                    </Link>
                    <Link
                        href={`/followers?user_id=${encodeURIComponent(profile.user_id)}`}
                        className="hover:underline cursor-pointer"
                    >
                        <span className="font-bold text-bat-gray mr-1">{profile.followers_count ?? 0}</span>
                        <span className="text-bat-gray/60">Followers</span>
                    </Link>
                </div>

                {/* Linked accounts badges — only visible on the user's own profile */}
                {isOwnProfile && linkedAccounts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {linkedAccounts.map((la) => (
                            <button
                                key={la.id}
                                onClick={async () => {
                                    const ok = await switchToLinked(la.peer_id, identity?.home_server || '');
                                    if (ok) {
                                        router.push('/feed');
                                    } else {
                                        router.push('/linked-accounts');
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bat-yellow/10 border border-bat-yellow/30 text-bat-yellow text-xs hover:bg-bat-yellow/20 transition-colors cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    className="w-3 h-3">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                <span>Switch to&nbsp;</span>
                                <span className="font-semibold">
                                    {la.peer_name || la.peer_id.split('@')[0]}
                                </span>
                                <span className="text-bat-yellow/60">
                                    @{la.peer_id.split('@')[1]}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {}
            <div
                className="mt-2 flex border-b border-bat-dark"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {TABS.map((tab, i) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(i); setTabAnimKey(k => k + 1); }}
                        className={`
                            flex-1 py-4 text-center text-sm sm:text-base font-medium transition-all duration-200 hover:bg-bat-dark/30
                            ${i === activeTab
                                ? 'text-bat-yellow border-b-[3px] border-bat-yellow'
                                : 'text-bat-gray/60 hover:text-bat-gray border-b-[3px] border-transparent'
                            }
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {}
            <div
                key={tabAnimKey}
                className="flex-1 animate-fade-up"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {activeTab === 0 && (
                    loadingPosts ? (
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
                                <PostCard key={post.id} post={post} linkBase={linkBase} />
                            ))}
                        </div>
                    )
                )}

                {/* Replies tab */}
                {activeTab === 1 && (
                    loadingPosts ? (
                        <div className="text-center text-bat-gray py-8">Loading replies...</div>
                    ) : replies.length === 0 ? (
                        <div className="p-8 text-center border-t border-bat-dark/50">
                            <div className="text-bat-gray/40 text-lg font-medium">No replies yet</div>
                            <div className="text-bat-gray/20 text-sm mt-1">
                                {isOwnProfile ? "Join a conversation!" : "Nothing here yet."}
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-bat-dark/50 divide-y divide-bat-dark/40">
                            {replies.map((rep) => (
                                <div
                                    key={rep.id}
                                    className="px-4 pt-3 pb-1 hover:bg-bat-dark/10 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/post/${rep.post_id}`)}
                                >
                                    {rep.post_content && (
                                        <div className="mb-1.5 pl-3 border-l-2 border-bat-gray/20 text-xs text-bat-gray/40 line-clamp-2">
                                            <span className="font-semibold text-bat-gray/50">
                                                @{rep.post_author.split('@')[0]}:&nbsp;
                                            </span>
                                            {rep.post_content}
                                        </div>
                                    )}
                                    <div className="flex gap-2 items-start">
                                        <div className="shrink-0 h-7 w-7 rounded-full bg-bat-dark flex items-center justify-center text-bat-yellow font-bold text-xs select-none">
                                            {(profile.display_name || profile.user_id)[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-bat-gray/70 text-xs mr-2">
                                                {new Date(rep.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <p className="text-bat-gray text-[14px] leading-normal whitespace-pre-wrap">{rep.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Highlights tab — posts this user has reposted */}
                {activeTab === 2 && (
                    loadingPosts ? (
                        <div className="text-center text-bat-gray py-8">Loading highlights...</div>
                    ) : highlights.length === 0 ? (
                        <div className="p-8 text-center border-t border-bat-dark/50">
                            <div className="text-bat-gray/40 text-lg font-medium">No highlights yet</div>
                            <div className="text-bat-gray/20 text-sm mt-1">
                                {isOwnProfile ? "Repost content to highlight it here." : "Nothing here yet."}
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-bat-dark/50">
                            {highlights.map((post) => (
                                <PostCard key={post.id} post={post} linkBase={linkBase} />
                            ))}
                        </div>
                    )
                )}

                {/* Likes tab */}
                {activeTab === 3 && (
                    loadingPosts ? (
                        <div className="text-center text-bat-gray py-8">Loading likes...</div>
                    ) : likedPosts.length === 0 ? (
                        <div className="p-8 text-center border-t border-bat-dark/50">
                            <div className="text-bat-gray/40 text-lg font-medium">No likes yet</div>
                            <div className="text-bat-gray/20 text-sm mt-1">
                                {isOwnProfile ? "Like posts to see them here." : "Nothing here yet."}
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-bat-dark/50">
                            {likedPosts.map((post) => (
                                <PostCard key={post.id} post={post} linkBase={linkBase} />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
