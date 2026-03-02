"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfileCard from '../components/ProfileCard';
import { Post } from '@/types/post';

interface UserProfile {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    bannerUrl: string;
    location: string;
    portfolioUrl: string;
    followersCount: number;
    followingCount: number;
    isFollowing?: boolean;
    createdAt?: string;
    updatedAt?: string;
    // Federation metadata
    isFederated?: boolean;
    remoteServer?: string;
    discoveryStatus?: string; // "already_trusted" | "auto_handshake" | "not_found" | "unhealthy"
}

interface UserReply {
    id: string;
    post_id: string;
    post_content: string;
    post_author: string;
    content: string;
    created_at: string;
}

export default function SearchPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [federationStep, setFederationStep] = useState<string>('');

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [userReplies, setUserReplies] = useState<UserReply[]>([]);
    const [likedPosts, setLikedPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // tracks the last local user_id queried so refreshProfile knows what to hit
    const lastQueryRef = useRef<string>('');
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // cleanup debounce timer on unmount
    useEffect(() => () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }, []);

    // ------------------------------------------------------------------
    // Fetch posts + replies + likes for a found user
    // ------------------------------------------------------------------
    const fetchUserContent = useCallback(async (userId: string, isFederated = false) => {
        if (!identity) return;
        setLoadingPosts(true);
        try {
            const base = identity.home_server;
            const uid = encodeURIComponent(userId);
            const vid = encodeURIComponent(identity.user_id);

            if (isFederated) {
                const res = await fetch(`${base}/api/posts/federated?user_id=${uid}&viewer_id=${vid}`);
                if (res.ok) { const d = await res.json(); setUserPosts(d.posts || []); }
                setUserReplies([]);
                setLikedPosts([]);
            } else {
                const [postsRes, repliesRes, likesRes] = await Promise.all([
                    fetch(`${base}/posts/user?user_id=${uid}&viewer_id=${vid}`),
                    fetch(`${base}/posts/user/replies?user_id=${uid}`),
                    fetch(`${base}/posts/user/likes?user_id=${uid}&viewer_id=${vid}`),
                ]);
                if (postsRes.ok)   { const d = await postsRes.json();   setUserPosts(d.posts || []); }
                if (repliesRes.ok) { const d = await repliesRes.json(); setUserReplies(d.replies || []); }
                if (likesRes.ok)   { const d = await likesRes.json();   setLikedPosts(d.posts || []); }
            }
        } catch (err) {
            console.error('Error fetching user content:', err);
        } finally {
            setLoadingPosts(false);
        }
    }, [identity]);

    // ------------------------------------------------------------------
    // Re-fetch profile from server to get accurate counts/state
    // Called after follow/unfollow/block actions
    // ------------------------------------------------------------------
    const refreshProfile = useCallback(async () => {
        const query = lastQueryRef.current;
        if (!query || !identity) return;
        try {
            const res = await fetch(
                `${identity.home_server}/user/search?user_id=${encodeURIComponent(query)}&viewer_id=${encodeURIComponent(identity.user_id)}`
            );
            if (!res.ok) return;
            const data = await res.json();
            if (!data.identity || !data.profile) return;
            setSelectedUser(prev => prev ? {
                ...prev,
                displayName:    data.profile.display_name    || prev.displayName,
                avatarUrl:      data.profile.avatar_url      || prev.avatarUrl,
                bio:            data.profile.bio             ?? prev.bio,
                bannerUrl:      data.profile.banner_url      || prev.bannerUrl,
                location:       data.profile.location        ?? prev.location,
                portfolioUrl:   data.profile.portfolio_url   ?? prev.portfolioUrl,
                followersCount: data.profile.followers_count ?? prev.followersCount,
                followingCount: data.profile.following_count ?? prev.followingCount,
                isFollowing:    typeof data.is_following === 'boolean' ? data.is_following : prev.isFollowing,
                createdAt:      data.profile.created_at      || prev.createdAt,
                updatedAt:      data.profile.updated_at      || prev.updatedAt,
            } : null);
        } catch (err) {
            console.error('Failed to refresh profile:', err);
        }
    }, [identity]);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(refreshProfile, 400);
    }, [refreshProfile]);

    // ------------------------------------------------------------------
    // Build a UserProfile from a local /user/search response
    // ------------------------------------------------------------------
    const buildLocalUser = (data: any): UserProfile => ({
        userId:         data.identity.user_id,
        username:       data.identity.user_id.split('@')[0],
        displayName:    data.profile.display_name  || 'Unknown',
        avatarUrl:      data.profile.avatar_url    || '',
        bio:            data.profile.bio           || '',
        bannerUrl:      data.profile.banner_url    || '',
        location:       data.profile.location      || '',
        portfolioUrl:   data.profile.portfolio_url || '',
        followersCount: data.profile.followers_count ?? 0,
        followingCount: data.profile.following_count ?? 0,
        isFollowing:    data.is_following,
        createdAt:      data.profile.created_at,
        updatedAt:      data.profile.updated_at,
        isFederated:    false,
    });

    // ------------------------------------------------------------------
    // Core search logic — extracted so it can be called from the URL param
    // auto-load as well as the manual search button
    // ------------------------------------------------------------------
    const runSearch = useCallback(async (query: string) => {
        if (!query.trim() || !identity) return;

        lastQueryRef.current = '';
        setSearchQuery(query);
        setSearching(true);
        setHasSearched(true);
        setSelectedUser(null);
        setUserPosts([]);
        setUserReplies([]);
        setLikedPosts([]);
        setFederationStep('');

        try {
            const isFederated = query.includes('@');

            if (isFederated) {
                const parts = query.split('@');
                const serverSuffix = parts.length === 2 ? parts[1] : '';
                const currentServerSuffix = identity.user_id.split('@')[1] || '';
                const isCurrentServer = serverSuffix === currentServerSuffix;

                if (isCurrentServer || !serverSuffix) {
                    // Same server — local lookup
                    setFederationStep('Searching local server…');
                    const res = await fetch(
                        `${identity.home_server}/user/search?user_id=${encodeURIComponent(query)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                    );

                    if (res.ok) {
                        const data = await res.json();
                        if (data.identity && data.profile) {
                            const user = buildLocalUser(data);
                            lastQueryRef.current = user.userId;
                            setSelectedUser(user);
                            fetchUserContent(user.userId, false);
                        } else {
                            setSelectedUser(null);
                        }
                    } else {
                        setSelectedUser(null);
                    }
                    setFederationStep('');
                } else {
                    // Remote server — federated lookup with auto-discovery
                    setFederationStep(`Checking server "${serverSuffix}"…`);
                    await new Promise(r => setTimeout(r, 300)); // let the UI update

                    const res = await fetch(
                        `${identity.home_server}/search?q=${encodeURIComponent(query)}`
                    );

                    if (!res.ok) {
                        const errText = await res.text();
                        console.error('Federated search error:', errText);
                        setSelectedUser(null);
                        setFederationStep(`Search failed: ${res.status}`);
                        return;
                    }

                    const data = await res.json();

                    // Show live discovery progress
                    const status: string = data.discovery_status || '';
                    if (status === 'auto_handshake') {
                        setFederationStep(`New server — handshake succeeded ✓`);
                        await new Promise(r => setTimeout(r, 600));
                    } else if (status === 'unhealthy') {
                        setFederationStep(`Server "${serverSuffix}" is unreachable`);
                        setSelectedUser(null);
                        return;
                    } else if (status === 'not_found') {
                        setFederationStep(`Server "${serverSuffix}" is not known`);
                        setSelectedUser(null);
                        return;
                    }

                    if (data.found && data.user) {
                        setFederationStep(`Fetching identity from "${serverSuffix}"…`);
                        await new Promise(r => setTimeout(r, 200));

                        const user: UserProfile = {
                            userId: data.user.user_id,
                            username: data.user.username,
                            displayName: data.user.display_name || 'Unknown',
                            avatarUrl: data.user.avatar_url || '',
                            bio: data.user.bio || '',
                            bannerUrl: '',
                            location: '',
                            portfolioUrl: '',
                            followersCount: 0,
                            followingCount: 0,
                            isFollowing: false,
                            isFederated: true,
                            remoteServer: serverSuffix,
                            discoveryStatus: status,
                        };
                        setSelectedUser(user);
                        fetchUserContent(user.userId, true);
                    } else {
                        setSelectedUser(null);
                    }
                    setFederationStep('');
                }
            } else {
                // Plain username — local search
                setFederationStep('Searching…');
                const res = await fetch(
                    `${identity.home_server}/user/search?user_id=${encodeURIComponent(query)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    if (data.identity && data.profile) {
                        const user = buildLocalUser(data);
                        lastQueryRef.current = user.userId;
                        setSelectedUser(user);
                        fetchUserContent(user.userId, false);
                    } else {
                        setSelectedUser(null);
                    }
                } else {
                    setSelectedUser(null);
                }
                setFederationStep('');
            }
        } catch (err) {
            console.error('Search error:', err);
            setSelectedUser(null);
            setFederationStep('');
        } finally {
            setSearching(false);
        }
    }, [identity, fetchUserContent, buildLocalUser]);

    const handleSearch = () => {
        if (!searchQuery.trim() || !identity) return;
        // Push the user_id into the URL so back/forward and sharing work
        router.replace(`/search?user_id=${encodeURIComponent(searchQuery)}`);
        runSearch(searchQuery);
    };

    // When a result is selected (incl. via PostCard / ProfileCard link clicks
    // that push ?user_id= into the URL), auto-run the search.
    useEffect(() => {
        if (authLoading || !identity) return;
        const uid = searchParams.get('user_id');
        if (uid) runSearch(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, identity, authLoading]);

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [authLoading, identity, router]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-bat-black">
                <div className="w-8 h-8 border-2 border-bat-yellow/30 border-t-bat-yellow rounded-full animate-spin" />
            </div>
        );
    }

    if (!identity) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">

            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-bat-gray mb-1">Search</h1>
                <p className="text-bat-gray/40 text-sm">
                    Find users on this server or across federated servers
                </p>
            </div>

            {/* ── Search bar ── */}
            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    placeholder="username  or  alice@server_b"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="
                        flex-1 px-4 py-3 rounded-xl
                        bg-bat-dark border border-bat-gray/20
                        text-bat-gray placeholder-bat-gray/30
                        focus:border-bat-yellow/50 focus:outline-none
                        transition-colors
                    "
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="
                        px-5 py-3 rounded-xl font-bold text-sm
                        bg-bat-yellow text-bat-black
                        hover:bg-yellow-400
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition-all shrink-0
                    "
                >
                    {searching ? 'Searching…' : 'Search'}
                </button>
            </div>

            {/* Live federation status */}
            {searching && federationStep && (
                <div className="flex items-center gap-2 text-xs text-bat-yellow/80 mt-1.5 px-1">
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-bat-yellow/30 border-t-bat-yellow" />
                    {federationStep}
                </div>
            )}

            {/* ── Results ── */}
            <div className="mt-6">
                {hasSearched && (
                    <>
                        {searching ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 text-bat-gray/40">
                                <div className="w-8 h-8 border-2 border-bat-yellow/30 border-t-bat-yellow rounded-full animate-spin" />
                                <p className="text-sm">{federationStep || 'Searching…'}</p>
                            </div>
                        ) : selectedUser ? (
                            <div className="space-y-4">
                                {/* Remote-server badge */}
                                {selectedUser.isFederated && selectedUser.remoteServer && (
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bat-blue/10 border border-bat-blue/30 text-bat-blue">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 1.5a6.5 6.5 0 110 13A6.5 6.5 0 0110 3.5zm-.75 3v3.5H6.5l3.5 5 3.5-5h-2.75V6.5h-1.5z" />
                                            </svg>
                                            @{selectedUser.remoteServer}
                                        </span>
                                        {selectedUser.discoveryStatus === 'auto_handshake' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-bat-dark border border-bat-gray/20 text-bat-gray/60">
                                                ✓ auto-connected
                                            </span>
                                        )}
                                        {selectedUser.discoveryStatus === 'already_trusted' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-bat-dark border border-bat-gray/20 text-bat-gray/40">
                                                trusted server
                                            </span>
                                        )}
                                    </div>
                                )}

                                <ProfileCard
                                    profile={{
                                        user_id: selectedUser.userId,
                                        display_name: selectedUser.displayName,
                                        avatar_url: selectedUser.avatarUrl,
                                        bio: selectedUser.bio,
                                        banner_url: selectedUser.bannerUrl,
                                        location: selectedUser.location,
                                        portfolio_url: selectedUser.portfolioUrl,
                                        followers_visibility: 'public',
                                        following_visibility: 'public',
                                        followers_count: selectedUser.followersCount,
                                        following_count: selectedUser.followingCount,
                                    created_at: selectedUser.createdAt || new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                    }}
                                    isFollowing={selectedUser.isFollowing}
                                    posts={userPosts}
                                    replies={userReplies}
                                    likedPosts={likedPosts}
                                    loadingPosts={loadingPosts}
                                    linkBase="/search"
                                    onFollowChange={(delta) => {
                                        // Immediately mirror the change in parent state so the
                                        // profile prop doesn't reset ProfileCard's local state
                                        setSelectedUser(prev => prev ? {
                                            ...prev,
                                            isFollowing: delta === 1,
                                            followersCount: Math.max(0, (prev.followersCount ?? 0) + delta),
                                        } : null);
                                        // For local users, also re-fetch from server for accurate counts
                                        scheduleRefresh();
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <div className="w-14 h-14 rounded-full bg-bat-dark flex items-center justify-center">
                                    <svg className="h-7 w-7 text-bat-gray/30 fill-none stroke-current" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <p className="text-bat-gray/50 text-sm">No users found</p>
                                <p className="text-bat-gray/30 text-xs">Try a different username or server</p>
                            </div>
                        )}
                    </>
                )}

                {!hasSearched && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <div className="w-14 h-14 rounded-full bg-bat-dark flex items-center justify-center">
                            <svg className="h-7 w-7 fill-none stroke-current text-bat-gray/20" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-bat-gray/30 text-sm">Search for a user to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
