"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '../utils/api';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';

export default function ExplorePage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
    const [posts, setPosts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
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
                    
                    const res = await apiGet('/posts/recent?limit=20');

                    if (res.ok) {
                        const data = await res.json();
                        setPosts(data.posts || []);
                    }
                } else {
                    
                    const res = await apiGet('/users/suggested?limit=20');

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
            <div className="max-w-3xl mx-auto p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Explore</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {}
            <div className="flex gap-4 mb-6 border-b border-bat-gray/20">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`pb-3 px-4 font-bold transition-all duration-200 relative ${activeTab === 'posts'
                        ? 'text-bat-yellow'
                        : 'text-bat-gray hover:text-bat-gray/80'
                        }`}
                >
                    Posts
                    <div className={`absolute bottom-0 left-0 right-0 h-0.75 rounded-t transition-all duration-300 ${activeTab === 'posts' ? 'bg-bat-yellow opacity-100 scale-x-100' : 'bg-bat-yellow opacity-0 scale-x-0'}`} />
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-4 font-bold transition-all duration-200 relative ${activeTab === 'users'
                        ? 'text-bat-yellow'
                        : 'text-bat-gray hover:text-bat-gray/80'
                        }`}
                >
                    Users
                    <div className={`absolute bottom-0 left-0 right-0 h-0.75 rounded-t transition-all duration-300 ${activeTab === 'users' ? 'bg-bat-yellow opacity-100 scale-x-100' : 'bg-bat-yellow opacity-0 scale-x-0'}`} />
                </button>
            </div>

            {}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                </div>
            ) : (
                <div className="animate-fade-up">
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
                </div>
            )}
        </div>
    );
}
