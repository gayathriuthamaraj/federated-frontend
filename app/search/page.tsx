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

    // Profile display state
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !identity) return;

        setSearching(true);
        setHasSearched(true);
        setSelectedUser(null); // Clear previous selection

        try {
            const res = await fetch(
                `${identity.home_server}/user/search?user_id=${encodeURIComponent(searchQuery)}&viewer_id=${encodeURIComponent(identity.user_id)}`
            );

            if (res.ok) {
                const data = await res.json();
                // The backend returns a single user with identity and profile
                if (data.identity && data.profile) {
                    // Fetch followers and following counts
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

                    // Show the user profile immediately
                    setSelectedUser(user);

                    // Fetch their posts
                    fetchUserPosts(user.userId);
                } else {
                    setSelectedUser(null);
                }
            } else {
                setSelectedUser(null);
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
                `${identity.home_server}/posts/user?user_id=${encodeURIComponent(userId)}&viewer_id=${encodeURIComponent(identity.user_id)}`
            );

            if (res.ok) {
                const data = await res.json();
                setUserPosts(data.posts || []);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
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
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    if (!identity) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Search Users</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search for users on your home server..."
                            className="
                                w-full px-4 py-3 pl-12 rounded-lg
                                bg-bat-dark text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bat-gray/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="
                            px-6 py-3 rounded-lg font-bold
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>
                <p className="text-sm text-bat-gray/60 mt-2">
                    Search by username or user ID (e.g., "alice" or "alice@localhost")
                </p>
            </div>

            {/* Results */}
            {searching ? (
                <div className="text-center py-12 text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Searching...</p>
                </div>
            ) : hasSearched ? (
                selectedUser ? (
                    <div>
                        {/* User Profile - includes posts */}
                        <ProfileCard
                            profile={{
                                user_id: selectedUser.userId,
                                display_name: selectedUser.displayName,
                                avatar_url: selectedUser.avatarUrl,
                                bio: selectedUser.bio,
                                banner_url: selectedUser.bannerUrl,
                                portfolio_url: selectedUser.portfolioUrl,
                                birth_date: '',
                                location: selectedUser.location,
                                followers_visibility: 'public',
                                following_visibility: 'public',
                                created_at: '',
                                updated_at: '',
                                followers_count: selectedUser.followersCount,
                                following_count: selectedUser.followingCount,
                            }}
                            isOwnProfile={false}
                            isFollowing={selectedUser.isFollowing}
                            posts={userPosts}
                            loadingPosts={loadingPosts}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12 text-bat-gray">
                        <svg className="w-16 h-16 mx-auto mb-4 text-bat-gray/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg">No users found</p>
                        <p className="text-sm mt-2">Try searching with a different query</p>
                    </div>
                )
            ) : (
                <div className="text-center py-12 text-bat-gray/60">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-lg">Search for users on your home server</p>
                    <p className="text-sm mt-2">Enter a username or user ID to get started</p>
                </div>
            )}
        </div>
    );
}
