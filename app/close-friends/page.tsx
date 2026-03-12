"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCloseFriends } from '../context/CloseFriendsContext';

interface Follower {
    identity: { user_id: string; home_server?: string };
    profile: { display_name?: string; avatar_url?: string };
}

export default function CloseFriendsPage() {
    const { identity } = useAuth();
    const { closeFriends, addCloseFriend, removeCloseFriend, refresh } = useCloseFriends();
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const loadFollowers = useCallback(async () => {
        if (!identity) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${identity.home_server}/followers?user_id=${encodeURIComponent(identity.user_id)}&viewer_id=${encodeURIComponent(identity.user_id)}`
            );
            if (!res.ok) return;
            const data = await res.json();
            setFollowers((data.followers ?? []).filter((f: Follower) => f?.identity?.user_id));
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [identity]);

    useEffect(() => {
        loadFollowers();
        refresh();
    }, [loadFollowers, refresh]);

    const handleToggle = async (userId: string) => {
        setToggling(userId);
        try {
            if (closeFriends.has(userId)) {
                await removeCloseFriend(userId);
            } else {
                await addCloseFriend(userId);
            }
        } finally {
            setToggling(null);
        }
    };

    const filtered = search.trim()
        ? followers.filter(f => {
            const q = search.toLowerCase();
            return (
                f.identity.user_id.toLowerCase().includes(q) ||
                (f.profile.display_name ?? '').toLowerCase().includes(q)
            );
        })
        : followers;

    const closeFriendCount = followers.filter(f => closeFriends.has(f.identity.user_id)).length;

    return (
        <div className="max-w-lg mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-bat-gray tracking-wide mb-1">Close Friends</h1>
                <p className="text-sm text-bat-gray/50">
                    Posts visible to close friends will appear with a green border in your feed.
                    Only your followers can be added.
                </p>
            </div>

            {/* Stats bar */}
            {!loading && (
                <div className="flex items-center gap-4 mb-5 text-sm text-bat-gray/50">
                    <span><span className="text-green-400 font-semibold">{closeFriendCount}</span> close friend{closeFriendCount !== 1 ? 's' : ''}</span>
                    <span>{followers.length} follower{followers.length !== 1 ? 's' : ''} total</span>
                </div>
            )}

            {/* Search */}
            {followers.length > 0 && (
                <input
                    type="text"
                    placeholder="Search followers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-bat-gray/10 border border-bat-gray/20 rounded-lg px-4 py-2 text-sm text-bat-gray mb-4 focus:outline-none focus:border-bat-yellow/40"
                />
            )}

            {/* Follower list */}
            {loading && (
                <p className="text-bat-gray/40 text-sm text-center py-12">Loading followers...</p>
            )}

            {!loading && followers.length === 0 && (
                <p className="text-bat-gray/40 text-sm text-center py-12">
                    You don&apos;t have any followers yet.
                </p>
            )}

            {!loading && followers.length > 0 && filtered.length === 0 && (
                <p className="text-bat-gray/40 text-sm text-center py-8">No followers match your search.</p>
            )}

            <div className="space-y-2">
                {filtered.map(f => {
                    const uid = f.identity.user_id;
                    const isClose = closeFriends.has(uid);
                    const busy = toggling === uid;
                    const name = f.profile.display_name || uid.split('@')[0];

                    return (
                        <div
                            key={uid}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                isClose
                                    ? 'border-green-500/30 bg-green-500/[0.04]'
                                    : 'border-bat-gray/10 bg-bat-gray/[0.03] hover:bg-bat-gray/[0.06]'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Avatar */}
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                                    isClose
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-bat-yellow/10 text-bat-yellow border border-bat-yellow/20'
                                }`}>
                                    {name[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-bat-gray truncate">{name}</p>
                                    <p className="text-xs text-bat-gray/40 truncate">@{uid}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggle(uid)}
                                disabled={busy}
                                className={`shrink-0 ml-3 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                                    isClose
                                        ? 'border-green-500/40 bg-green-500/15 text-green-400 hover:bg-green-500/25'
                                        : 'border-bat-gray/20 text-bat-gray/50 hover:border-bat-yellow/40 hover:text-bat-yellow'
                                }`}
                            >
                                {busy ? '...' : isClose ? '★ Close Friend' : '☆ Add'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
