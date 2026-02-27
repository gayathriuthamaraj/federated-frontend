"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet } from '../utils/api';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';
import RightPanel from '../components/RightPanel';

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
            <div className="flex min-h-full">
                <div className="flex-1 min-w-0 max-w-165 border-r border-bat-dark/40 px-4 py-4 space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                </div>
                <div className="hidden xl:block w-90 shrink-0 px-6 py-4">
                    <div className="skeleton h-48 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full">
            {/* â”€â”€ Center column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex-1 min-w-0 max-w-165 border-r border-bat-dark/40">
                {/* Sticky header */}
                <div className="sticky top-0 z-10 backdrop-blur-md bg-bat-black/85 border-b border-bat-dark/50 px-4 py-3">
                    <h1 className="font-bold text-[1.05rem] text-gray-100 tracking-tight">Explore</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-bat-dark/50">
                    {(['posts', 'users'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors relative ${
                                activeTab === tab ? 'text-gray-100' : 'text-bat-gray/50 hover:text-bat-gray/80'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.75 rounded-t-full bg-bat-yellow" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="px-4 py-4 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
                        ))}
                    </div>
                ) : (
                    <div className="animate-fade-up">
                        {activeTab === 'posts' ? (
                            posts.length === 0 ? (
                                <div className="text-center py-16 text-bat-gray/40">
                                    <p>No posts to explore yet</p>
                                </div>
                            ) : (
                                posts.map(post => <PostCard key={post.id} post={post} />)
                            )
                        ) : (
                            users.length === 0 ? (
                                <div className="text-center py-16 text-bat-gray/40">
                                    <p>No users to suggest yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-bat-dark/40">
                                    {users.map(user => (
                                        <UserCard key={user.userId} user={user} showFollowButton={true} />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* â”€â”€ Right panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="hidden xl:block w-90 shrink-0 px-6 py-4">
                <div className="sticky top-4">
                    <RightPanel />
                </div>
            </div>
        </div>
    );
}
