"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileCard from '../components/ProfileCard';
import PostCard from '../components/PostCard';
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
    // Federation metadata
    isFederated?: boolean;
    remoteServer?: string;
    discoveryStatus?: string; // "already_trusted" | "auto_handshake" | "not_found" | "unhealthy"
}

export default function SearchPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [federationStep, setFederationStep] = useState<string>('');  // live discovery status text

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !identity) return;

        setSearching(true);
        setHasSearched(true);
        setSelectedUser(null);
        setUserPosts([]);
        setFederationStep('');

        try {
            const isFederated = searchQuery.includes('@');

            if (isFederated) {
                const parts = searchQuery.split('@');
                const serverSuffix = parts.length === 2 ? parts[1] : '';
                const currentServerSuffix = identity.user_id.split('@')[1] || '';
                const isCurrentServer = serverSuffix === currentServerSuffix;

                if (isCurrentServer || !serverSuffix) {
                    // Same server — local lookup
                    setFederationStep('Searching local server…');
                    const res = await fetch(
                        `${identity.home_server}/user/search?user_id=${encodeURIComponent(searchQuery)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                    );

                    if (res.ok) {
                        const data = await res.json();
                        if (data.identity && data.profile) {
                            const [followersRes, followingRes] = await Promise.all([
                                fetch(`${identity.home_server}/followers?user_id=${encodeURIComponent(data.identity.user_id)}`),
                                fetch(`${identity.home_server}/following?user_id=${encodeURIComponent(data.identity.user_id)}`)
                            ]);

                            const followersCount = followersRes.ok ? ((await followersRes.json()).followers?.length || 0) : 0;
                            const followingCount = followingRes.ok ? ((await followingRes.json()).following?.length || 0) : 0;

                            const user: UserProfile = {
                                userId: data.identity.user_id,
                                username: data.identity.user_id.split('@')[0],
                                displayName: data.profile.display_name || 'Unknown',
                                avatarUrl: data.profile.avatar_url || '',
                                bio: data.profile.bio || '',
                                bannerUrl: data.profile.banner_url || '',
                                location: data.profile.location || '',
                                portfolioUrl: data.profile.portfolio_url || '',
                                followersCount,
                                followingCount,
                                isFollowing: data.is_following,
                                isFederated: false,
                            };
                            setSelectedUser(user);
                            fetchUserPosts(user.userId);
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
                        `${identity.home_server}/api/search?q=${encodeURIComponent(searchQuery)}`
                    );

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
                        fetchUserPosts(user.userId, true);
                    } else {
                        setSelectedUser(null);
                    }
                    setFederationStep('');
                }
            } else {
                // Plain username — local search
                setFederationStep('Searching…');
                const res = await fetch(
                    `${identity.home_server}/user/search?user_id=${encodeURIComponent(searchQuery)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                );

                if (res.ok) {
                    const data = await res.json();
                    if (data.identity && data.profile) {
                        const [followersRes, followingRes] = await Promise.all([
                            fetch(`${identity.home_server}/followers?user_id=${encodeURIComponent(data.identity.user_id)}`),
                            fetch(`${identity.home_server}/following?user_id=${encodeURIComponent(data.identity.user_id)}`)
                        ]);

                        const followersCount = followersRes.ok ? ((await followersRes.json()).followers?.length || 0) : 0;
                        const followingCount = followingRes.ok ? ((await followingRes.json()).following?.length || 0) : 0;

                        const user: UserProfile = {
                            userId: data.identity.user_id,
                            username: data.identity.user_id.split('@')[0],
                            displayName: data.profile.display_name || 'Unknown',
                            avatarUrl: data.profile.avatar_url || '',
                            bio: data.profile.bio || '',
                            bannerUrl: data.profile.banner_url || '',
                            location: data.profile.location || '',
                            portfolioUrl: data.profile.portfolio_url || '',
                            followersCount,
                            followingCount,
                            isFollowing: data.is_following,
                            isFederated: false,
                        };
                        setSelectedUser(user);
                        fetchUserPosts(user.userId);
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
    };

    const fetchUserPosts = async (userId: string, isFederated = false) => {
        if (!identity) return;

        setLoadingPosts(true);
        try {
            const url = isFederated
                ? `${identity.home_server}/api/posts/federated?user_id=${encodeURIComponent(userId)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                : `${identity.home_server}/posts/user?user_id=${encodeURIComponent(userId)}&viewer_id=${encodeURIComponent(identity.user_id)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setUserPosts(data.posts || []);
            }
        } catch (err) {
            console.error('Error fetching user posts:', err);
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [authLoading, identity, router]);

    if (authLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!identity) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-6">Search Users</h1>

                <div className="flex gap-4 mb-2">
                    <input
                        type="text"
                        placeholder="username  or  alice@server_b  for cross-server"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold transition"
                    >
                        {searching ? 'Searching…' : 'Search'}
                    </button>
                </div>

                {/* Live federation status */}
                {(searching && federationStep) && (
                    <div className="flex items-center gap-2 text-sm text-yellow-400 mt-2 px-1">
                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400" />
                        {federationStep}
                    </div>
                )}
            </div>

            {hasSearched && (
                <div>
                    {searching ? (
                        <div className="text-center text-gray-400 py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4" />
                            <p>{federationStep || 'Searching…'}</p>
                        </div>
                    ) : selectedUser ? (
                        <div className="space-y-4">
                            {/* Remote-server badge */}
                            {selectedUser.isFederated && selectedUser.remoteServer && (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 border border-blue-500/40 text-blue-300">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 1.5a6.5 6.5 0 110 13A6.5 6.5 0 0110 3.5zm-.75 3v3.5H6.5l3.5 5 3.5-5h-2.75V6.5h-1.5z" />
                                        </svg>
                                        @{selectedUser.remoteServer}
                                    </span>
                                    {selectedUser.discoveryStatus === 'auto_handshake' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-900/30 border border-green-500/30 text-green-400">
                                            ✓ auto-connected
                                        </span>
                                    )}
                                    {selectedUser.discoveryStatus === 'already_trusted' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-800 border border-gray-600 text-gray-400">
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
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                }}
                                followersCount={selectedUser.followersCount}
                                followingCount={selectedUser.followingCount}
                                isFollowing={selectedUser.isFollowing}
                            />

                            {/* Posts section */}
                            {loadingPosts && (
                                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500" />
                                    Loading posts…
                                </div>
                            )}
                            {!loadingPosts && userPosts.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-white pt-2">Posts</h2>
                                    {userPosts.map(post => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </div>
                            )}
                            {!loadingPosts && userPosts.length === 0 && (
                                <p className="text-gray-500 text-sm pt-2">No posts yet.</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-800 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-gray-400">No users found</p>
                            <p className="text-gray-500 text-sm mt-2">Try searching with a different query</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
