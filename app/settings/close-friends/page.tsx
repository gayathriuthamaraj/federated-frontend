"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface CloseFriend {
    friend_id: string;
    display_name: string;
}

interface FollowerDoc {
    identity: { user_id: string; home_server: string };
    profile: { user_id: string; display_name: string };
}

export default function CloseFriendsPage() {
    const { identity } = useAuth();
    const router = useRouter();

    const [friends, setFriends] = useState<CloseFriend[]>([]);
    const [followers, setFollowers] = useState<FollowerDoc[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [loadingFollowers, setLoadingFollowers] = useState(true);
    const [mutating, setMutating] = useState<Record<string, boolean>>({});
    const [error, setError] = useState("");

    useEffect(() => {
        if (!identity) {
            router.push("/login");
        }
    }, [identity, router]);

    const fetchFriends = useCallback(async () => {
        if (!identity) return;
        setLoadingFriends(true);
        try {
            const token = localStorage.getItem("access_token") ?? "";
            const res = await fetch(
                `${identity.home_server}/close-friends?user_id=${encodeURIComponent(identity.user_id)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends ?? []);
            }
        } catch {
            setError("Failed to load close friends.");
        } finally {
            setLoadingFriends(false);
        }
    }, [identity]);

    const fetchFollowers = useCallback(async () => {
        if (!identity) return;
        setLoadingFollowers(true);
        try {
            const token = localStorage.getItem("access_token") ?? "";
            const res = await fetch(
                `${identity.home_server}/followers?user_id=${encodeURIComponent(identity.user_id)}&viewer_id=${encodeURIComponent(identity.user_id)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setFollowers(data.followers ?? []);
            }
        } catch {
            setError("Failed to load followers.");
        } finally {
            setLoadingFollowers(false);
        }
    }, [identity]);

    useEffect(() => {
        fetchFriends();
        fetchFollowers();
    }, [fetchFriends, fetchFollowers]);

    const addFriend = async (friendId: string) => {
        if (!identity) return;
        setMutating((m) => ({ ...m, [friendId]: true }));
        setError("");
        try {
            const token = localStorage.getItem("access_token") ?? "";
            const res = await fetch(`${identity.home_server}/close-friends`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_id: identity.user_id, friend_id: friendId }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setError(d.error ?? "Failed to add close friend.");
            } else {
                await fetchFriends();
            }
        } catch {
            setError("Network error.");
        } finally {
            setMutating((m) => ({ ...m, [friendId]: false }));
        }
    };

    const removeFriend = async (friendId: string) => {
        if (!identity) return;
        setMutating((m) => ({ ...m, [friendId]: true }));
        setError("");
        try {
            const token = localStorage.getItem("access_token") ?? "";
            const res = await fetch(`${identity.home_server}/close-friends/remove`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_id: identity.user_id, friend_id: friendId }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setError(d.error ?? "Failed to remove close friend.");
            } else {
                setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
            }
        } catch {
            setError("Network error.");
        } finally {
            setMutating((m) => ({ ...m, [friendId]: false }));
        }
    };

    if (!identity) return null;

    const friendIds = new Set(friends.map((f) => f.friend_id));

    // Followers who aren't already close friends
    const eligible = followers.filter(
        (f) => !friendIds.has(f.identity.user_id)
    );

    return (
        <div className="min-h-screen bg-bat-black text-bat-gray">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bat-black/90 backdrop-blur border-b border-bat-dark/60 px-4 py-3 flex items-center gap-3">
                <Link
                    href="/settings"
                    className="text-bat-gray/60 hover:text-bat-yellow transition-colors"
                    aria-label="Back to settings"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-base font-bold text-gray-200">Close Friends</h1>
                    <p className="text-xs text-bat-gray/50">
                        Posts set to &ldquo;Close friends&rdquo; are only visible to people on this list.
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {/* Close Friends section – heart icon  */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-pink-400" aria-hidden="true">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <h2 className="text-sm font-semibold text-gray-200">
                            Close friends{friends.length > 0 && <span className="ml-1.5 text-bat-gray/50 font-normal">({friends.length})</span>}
                        </h2>
                    </div>

                    {loadingFriends ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 rounded-xl bg-bat-dark/40 animate-pulse" />
                            ))}
                        </div>
                    ) : friends.length === 0 ? (
                        <div className="rounded-xl border border-bat-dark/60 bg-bat-dark/20 px-5 py-8 text-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-pink-400/30 mx-auto mb-2" aria-hidden="true">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <p className="text-sm text-bat-gray/50">No close friends yet.</p>
                            <p className="text-xs text-bat-gray/35 mt-1">Add followers below to share exclusive posts with them.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {friends.map((f) => {
                                const initials = (f.display_name || f.friend_id.split("@")[0] || "?")[0].toUpperCase();
                                return (
                                    <li
                                        key={f.friend_id}
                                        className="flex items-center gap-3 rounded-xl border border-bat-dark/60 bg-bat-dark/20 px-4 py-3"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 rounded-full bg-bat-dark border border-pink-500/20 items-center justify-center text-pink-400 font-bold text-sm select-none">
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-200 truncate">
                                                {f.display_name || f.friend_id.split("@")[0]}
                                            </p>
                                            <p className="text-xs text-bat-gray/50 truncate">@{f.friend_id}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFriend(f.friend_id)}
                                            disabled={!!mutating[f.friend_id]}
                                            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                                        >
                                            {mutating[f.friend_id] ? "…" : "Remove"}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Add from followers section */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-bat-gray/50" aria-hidden="true">
                            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        <h2 className="text-sm font-semibold text-gray-200">
                            Add from followers
                            {eligible.length > 0 && (
                                <span className="ml-1.5 text-bat-gray/50 font-normal">({eligible.length})</span>
                            )}
                        </h2>
                    </div>

                    {loadingFollowers ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 rounded-xl bg-bat-dark/40 animate-pulse" />
                            ))}
                        </div>
                    ) : eligible.length === 0 ? (
                        <div className="rounded-xl border border-bat-dark/60 bg-bat-dark/20 px-5 py-6 text-center">
                            <p className="text-sm text-bat-gray/50">
                                {followers.length === 0
                                    ? "You don't have any followers yet."
                                    : "All your followers are already in your close friends list."}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {eligible.map((f) => {
                                const uid = f.identity.user_id;
                                const name = f.profile.display_name || uid.split("@")[0];
                                const initials = name[0]?.toUpperCase() ?? "?";
                                return (
                                    <li
                                        key={uid}
                                        className="flex items-center gap-3 rounded-xl border border-bat-dark/60 bg-bat-dark/20 px-4 py-3"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 rounded-full bg-bat-dark border border-bat-yellow/20 items-center justify-center text-bat-yellow font-bold text-sm select-none">
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-200 truncate">{name}</p>
                                            <p className="text-xs text-bat-gray/50 truncate">@{uid}</p>
                                        </div>
                                        <button
                                            onClick={() => addFriend(uid)}
                                            disabled={!!mutating[uid]}
                                            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-900/30 text-pink-400 border border-pink-500/20 hover:bg-pink-900/50 disabled:opacity-50 transition-colors"
                                        >
                                            {mutating[uid] ? "…" : "Add"}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
