"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import UserCard from '../components/UserCard';

interface UserDocument {
    identity: {
        user_id: string;
        home_server: string;
    };
    profile: {
        user_id: string;
        display_name: string;
        avatar_url?: string;
        bio?: string;
    };
}

export default function FollowingPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [following, setFollowing] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    const fetchFollowing = useCallback(async () => {
        if (!identity) return;
        // Cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const url = `${identity.home_server}/following?user_id=${encodeURIComponent(identity.user_id)}`;
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setFollowing(data.following || []);
            }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.error(`Failed to fetch following from ${url}:`, err);
        } finally {
            setLoading(false);
        }
    }, [identity]);

    // Cleanup on unmount
    useEffect(() => () => { abortRef.current?.abort(); }, []);

    // Fetch on mount / manual refresh (guard: wait for auth to finish loading)
    useEffect(() => {
        if (!authLoading && identity) fetchFollowing();
    }, [identity, authLoading, refreshKey, fetchFollowing]);

    // Poll every 15 seconds
    useEffect(() => {
        if (!identity) return;
        const interval = setInterval(fetchFollowing, 15000);
        return () => clearInterval(interval);
    }, [identity, fetchFollowing]);

    // Re-fetch when the tab becomes visible again
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && identity) fetchFollowing();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [identity, fetchFollowing]);

    const handleUnfollow = async (userId: string) => {
        if (!identity) return;

        if (!confirm(`Unfollow ${userId}?`)) return;

        try {
            const res = await fetch(`${identity.home_server}/unfollow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    follower: identity.user_id,
                    followee: userId
                })
            });

            if (res.ok) {
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error('Failed to unfollow:', err);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading following...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Following</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                <p className="text-bat-gray/60 mt-2">{following.length} following</p>
            </div>

            {following.length === 0 ? (
                <div className="text-center py-12 text-bat-gray">
                    <p className="text-lg">Not following anyone yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {following.map(user => (
                        <div key={user.identity.user_id} className="flex items-center gap-3">
                            <div className="flex-1">
                                <UserCard
                                    user={{
                                        userId: user.identity.user_id,
                                        username: user.identity.user_id.split('@')[0],
                                        displayName: user.profile.display_name,
                                        avatarUrl: user.profile.avatar_url || '',
                                        bio: user.profile.bio || '',
                                    }}
                                    showFollowButton={false}
                                />
                            </div>
                            <button
                                onClick={() => handleUnfollow(user.identity.user_id)}
                                className="
                                    px-4 py-2 rounded-md font-medium text-sm
                                    bg-bat-black text-bat-gray
                                    border border-bat-gray/30
                                    hover:border-red-500 hover:text-red-500
                                    transition-all duration-200
                                "
                            >
                                Unfollow
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
