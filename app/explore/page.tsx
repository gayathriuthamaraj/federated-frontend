"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '../utils/api';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';
import RightPanel from '../components/RightPanel';

type Tab = 'posts' | 'users' | 'hashtag';

function ExploreContent() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = (searchParams.get('tab') as Tab) || 'posts';
    const tagParam = searchParams.get('tag') || '';

    const [activeTab, setActiveTab] = useState<Tab>(tabParam);
    const [activeTag, setActiveTag] = useState<string>(tagParam);
    const [posts, setPosts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    // Sync tab/tag from URL when navigating back (e.g. browser back button)
    useEffect(() => {
        setActiveTab(tabParam);
        setActiveTag(tagParam);
    }, [tabParam, tagParam]);

    useEffect(() => {
        async function fetchExplore() {
            if (!identity || authLoading) return;

            try {
                setLoading(true);
                setError(null);

                if (activeTab === 'hashtag' && activeTag) {
                    const tag = activeTag.replace(/^#/, '');
                    const res = await apiGet(
                        `/hashtags/posts?tag=${encodeURIComponent(tag)}&limit=30&user_id=${encodeURIComponent(identity.user_id)}`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        setPosts(data.posts || []);
                    } else {
                        setPosts([]);
                    }
                } else if (activeTab === 'posts') {
                    const res = await apiGet(
                        `/posts/recent?limit=20&user_id=${encodeURIComponent(identity.user_id)}`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        setPosts(data.posts || []);
                    } else {
                        setPosts([]);
                    }
                } else if (activeTab === 'users') {
                    const res = await apiGet('/users/suggested?limit=20');
                    if (res.ok) {
                        const data = await res.json();
                        const mapped = (data.users || []).map((u: any) => {
                            if (u?.identity?.user_id) {
                                return {
                                    userId: u.identity.user_id,
                                    username: u.identity.user_id.split('@')[0],
                                    displayName:
                                        u.profile?.display_name ||
                                        u.identity.user_id.split('@')[0],
                                    avatarUrl: u.profile?.avatar_url || '',
                                    bio: u.profile?.bio || '',
                                    followersCount: u.profile?.followers_count ?? 0,
                                    followingCount: u.profile?.following_count ?? 0,
                                };
                            }
                            return u;
                        });
                        setUsers(mapped);
                    } else {
                        setUsers([]);
                    }
                }
            } catch (err) {
                console.error('Explore fetch error:', err);
                setError('Failed to load content. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchExplore();
    }, [identity, activeTab, activeTag, authLoading]);

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
            <div className="flex-1 min-w-0 max-w-165 border-r border-bat-dark/40">
                <div className="sticky top-0 z-10 backdrop-blur-md bg-bat-black/85 border-b border-bat-dark/50 px-4 py-3">
                    {activeTab === 'hashtag' ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/explore?tab=posts')}
                                className="text-bat-gray/50 hover:text-bat-yellow transition-colors"
                                aria-label="Back to Explore"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="font-bold text-[1.05rem] text-bat-yellow tracking-tight">
                                    #{activeTag.replace(/^#/, '')}
                                </h1>
                                <p className="text-[11px] text-bat-gray/40">Posts with this hashtag</p>
                            </div>
                        </div>
                    ) : (
                        <h1 className="font-bold text-[1.05rem] text-gray-100 tracking-tight">Explore</h1>
                    )}
                </div>

                {activeTab !== 'hashtag' && (
                    <div className="flex border-b border-bat-dark/50">
                        {(['posts', 'users'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => router.push(`/explore?tab=${tab}`)}
                                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors relative ${
                                    activeTab === tab
                                        ? 'text-gray-100'
                                        : 'text-bat-gray/50 hover:text-bat-gray/80'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.75 rounded-t-full bg-bat-yellow" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-16 text-bat-gray/60">
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => setActiveTab(activeTab)}
                            className="mt-3 px-4 py-1.5 rounded-md text-xs font-semibold bg-bat-yellow/10 text-bat-yellow hover:bg-bat-yellow/20 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!error && (
                    loading ? (
                        <div className="px-4 py-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
                            ))}
                        </div>
                    ) : (
                        <div className="animate-fade-up">
                            {activeTab === 'hashtag' ? (
                                posts.length === 0 ? (
                                    <div className="text-center py-16 text-bat-gray/40">
                                        <p>No posts found for #{activeTag.replace(/^#/, '')}</p>
                                    </div>
                                ) : (
                                    posts.map(post => <PostCard key={post.id} post={post} />)
                                )
                            ) : activeTab === 'posts' ? (
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
                                        {users.map((user, idx) => (
                                            <UserCard
                                                key={user.userId || user.username || idx}
                                                user={user}
                                                showFollowButton={true}
                                            />
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    )
                )}
            </div>

            <div className="hidden xl:block w-90 shrink-0 px-6 py-4">
                <div className="sticky top-4">
                    <RightPanel />
                </div>
            </div>
        </div>
    );
}

export default function ExplorePage() {
    return (
        <Suspense
            fallback={
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
            }
        >
            <ExploreContent />
        </Suspense>
    );
}