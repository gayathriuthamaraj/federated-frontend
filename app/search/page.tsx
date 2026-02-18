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
}

export default function SearchPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);


    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !identity) return;

        setSearching(true);
        setHasSearched(true);
        setSelectedUser(null);

        try {
            // Check if this is a federated search (contains @)
            const isFederated = searchQuery.includes('@');

            if (isFederated) {
                // Extract server name from search query
                const parts = searchQuery.split('@');
                const serverName = parts.length === 2 ? parts[1] : '';

                //Check if we're searching for a user on the current server
                const currentServerName = identity.user_id.split('@')[1] || '';
                const isCurrentServer = serverName === currentServerName;

                if (isCurrentServer || !serverName) {
                    // Same server - use local search
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

                            let followersCount = 0;
                            let followingCount = 0;

                            if (followersRes.ok) {
                                const followersData = await followersRes.json();
                                followersCount = followersData.followers?.length || 0;
                            }

                            if (followingRes.ok) {
                                const followingData = await followingRes.json();
                                followingCount = followingData.following?.length || 0;
                            }

                            const user = {
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
                            };

                            setSelectedUser(user);
                            fetchUserPosts(user.userId);
                        } else {
                            setSelectedUser(null);
                        }
                    } else {
                        setSelectedUser(null);
                    }
                } else {
                    // Different server - use federated search API
                    const res = await fetch(
                        `${identity.home_server}/api/search?q=${encodeURIComponent(searchQuery)}`
                    );

                    if (res.ok) {
                        const data = await res.json();

                        if (data.found && data.user) {
                            const user = {
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
                            };

                            setSelectedUser(user);
                        } else {
                            setSelectedUser(null);
                        }
                    } else {
                        setSelectedUser(null);
                    }
                }
            } else {
                // Use local search API
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

                        let followersCount = 0;
                        let followingCount = 0;

                        if (followersRes.ok) {
                            const followersData = await followersRes.json();
                            followersCount = followersData.followers?.length || 0;
                        }

                        if (followingRes.ok) {
                            const followingData = await followingRes.json();
                            followingCount = followingData.following?.length || 0;
                        }

                        const user = {
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
                        };


                        setSelectedUser(user);


                        fetchUserPosts(user.userId);
                    } else {
                        setSelectedUser(null);
                    }
                } else {
                    setSelectedUser(null);
                }
            }
        } catch (err) {
            console.error('Search error:', err);
            setSelectedUser(null);
        } finally {
            setSearching(false);
        }
    };

    const fetchUserPosts = async (userId: string) => {
        if (!identity) return;

        setLoadingPosts(true);
        try {
            const res = await fetch(
                `${identity.home_server}/posts?author=${encodeURIComponent(userId)}`
            );
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

                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search by username or federated ID (e.g., 'alice' or 'alice@server-b')"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold transition"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {hasSearched && (
                <div>
                    {searching ? (
                        <div className="text-center text-gray-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
                            <p>Searching...</p>
                        </div>
                    ) : selectedUser ? (
                        <div className="space-y-6">
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
