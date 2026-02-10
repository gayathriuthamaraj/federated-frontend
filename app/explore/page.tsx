"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';

export default function ExplorePage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    useEffect(() => {
        async function fetchExplore() {
            if (!identity) return;

            try {
                setLoading(true);

                if (activeTab === 'posts') {
                    // Fetch recent posts from all users
                    const res = await fetch(
                        `${identity.home_server}/posts/recent?limit=20`
                    );

                    if (res.ok) {
                        const data = await res.json();
                        setPosts(data.posts || []);
                    }
                } else {
                    // Fetch suggested users
                    const res = await fetch(
                        `${identity.home_server}/users/suggested?user_id=${encodeURIComponent(identity.user_id)}&limit=20`
                    );

                    if (res.ok) {
                        const data = await res.json();
                        setUsers(data.users || []);
                    }
                }
            } catch (err) {
                console.error('Explore fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchExplore();
    }, [identity, activeTab]);

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

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Explore</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-bat-gray/20">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`pb-3 px-4 font-bold transition-colors relative ${activeTab === 'posts'
                            ? 'text-bat-yellow'
                            : 'text-bat-gray hover:text-bat-gray/80'
                        }`}
                >
                    Posts
                    {activeTab === 'posts' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-bat-yellow rounded-t"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-4 font-bold transition-colors relative ${activeTab === 'users'
                            ? 'text-bat-yellow'
                            : 'text-bat-gray hover:text-bat-gray/80'
                        }`}
                >
                    Users
                    {activeTab === 'users' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-bat-yellow rounded-t"></div>
                    )}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'posts' ? (
                        posts.length === 0 ? (
                            <div className="text-center py-12 text-bat-gray">
                                <p className="text-lg">No posts to explore yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )
                    ) : (
                        users.length === 0 ? (
                            <div className="text-center py-12 text-bat-gray">
                                <p className="text-lg">No users to suggest yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {users.map(user => (
                                    <UserCard
                                        key={user.userId}
                                        user={user}
                                        showFollowButton={true}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}
