"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCache } from '../context/CacheContext';
import { fetchProfileSWR, prefetchProfiles, normaliseProfileResponse } from '../utils/profileService';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
    id: string;
    sender: string;
    receiver: string;
    content: string;
    created_at: string;
}

interface Conversation {
    id: string;
    other_user: string;
    content: string;
    created_at: string;
}

// Shape stored in profile cache (normalised by profileService)
interface CachedProfile {
    profile: {
        user_id: string;
        display_name?: string;
        avatar_url?: string | null;
        bio?: string | null;
        followers_count?: number;
        following_count?: number;
    };
}

function MessagesContent() {
    const { identity, isLoading: authLoading } = useAuth();
    const cache = useCache();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    // Keyed by userId: profile data from the cache
    const [profiles, setProfiles] = useState<Record<string, CachedProfile>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const notifPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !identity) router.push('/login');
    }, [identity, authLoading, router]);

    // ── Pre-select user from query param ──────────────────────────────────────
    useEffect(() => {
        const u = searchParams.get('user');
        if (u) setSelectedUserId(u);
    }, [searchParams]);

    // ── Update local profiles map with fresh data from cache ──────────────────
    const updateProfile = useCallback((userId: string, data: any) => {
        setProfiles(prev => ({ ...prev, [userId]: data }));
    }, []);

    // ── Fetch a single profile via SWR ────────────────────────────────────────
    const loadProfile = useCallback(async (userId: string) => {
        if (!identity) return;
        // If already fresh in local component state, skip
        const fresh = cache.getProfile(userId);
        if (fresh && !fresh.isStale) {
            setProfiles(prev => ({ ...prev, [userId]: fresh.data }));
            return;
        }
        await fetchProfileSWR(userId, identity, cache, (uid, data) => {
            updateProfile(uid, data);
        });
        // Also push whatever is now in cache to component state
        const result = cache.getProfile(userId);
        if (result) setProfiles(prev => ({ ...prev, [userId]: result.data }));
    }, [identity, cache, updateProfile]);

    // ── Fetch conversations (SWR) ─────────────────────────────────────────────
    useEffect(() => {
        if (!identity) return;

        const run = async () => {
            // 1. Serve from cache immediately if available
            const cachedConvs = cache.getConversations(identity.user_id);
            if (cachedConvs) {
                setConversations(cachedConvs.data);
                setLoading(false);
                if (!cachedConvs.isStale) {
                    // FRESH — no network needed, still pre-warm profiles
                    prefetchProfiles(cachedConvs.data.map((c: Conversation) => c.other_user), identity, cache, updateProfile);
                    return;
                }
            } else {
                setLoading(true);
            }

            // 2. Fetch from server (either first load or stale revalidation)
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10_000);
            try {
                const accessToken = localStorage.getItem('access_token');
                const headers: HeadersInit = accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {};
                const res = await fetch(
                    `${identity.home_server}/messages?user_id=${encodeURIComponent(identity.user_id)}`,
                    { headers, signal: controller.signal }
                );
                if (res.ok) {
                    const data = await res.json();
                    // Backend returns {sender, receiver, ...} – compute other_user
                    const convs: Conversation[] = (data.conversations || []).map((c: any) => ({
                        id: c.id,
                        other_user: c.sender === identity.user_id ? c.receiver : c.sender,
                        content: c.content,
                        created_at: c.created_at,
                    }));
                    setConversations(convs);
                    setFetchError(null);
                    cache.setConversations(identity.user_id, convs);

                    // Pre-fetch all partner profiles via SWR
                    const partnerIds = [...new Set(convs.map(c => c.other_user))];
                    prefetchProfiles(partnerIds, identity, cache, updateProfile);
                } else {
                    const errText = await res.text().catch(() => `HTTP ${res.status}`);
                    setFetchError(`Server error (${res.status}): ${errText}`);
                    console.error('Conversations fetch failed:', res.status, errText);
                }
            } catch (err) {
                if ((err as Error)?.name !== 'AbortError') {
                    const msg = (err as Error)?.message || 'Network error';
                    setFetchError(msg);
                    console.error('Failed to fetch conversations:', err);
                }
            } finally {
                clearTimeout(timeout);
                setLoading(false);
            }
        };

        run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity, retryKey]);

    // ── Fetch messages for selected conversation (SWR) ────────────────────────
    useEffect(() => {
        if (!identity || !selectedUserId) return;

        // Load the selected user's profile
        loadProfile(selectedUserId);

        const run = async () => {
            // 1. Serve from cache immediately
            const cachedMsgs = cache.getMessages(identity.user_id, selectedUserId);
            if (cachedMsgs) {
                setMessages(cachedMsgs.data);
                if (!cachedMsgs.isStale) return; // FRESH — skip network
            }

            // 2. Fetch from server
            try {
                const accessToken = localStorage.getItem('access_token');
                const headers: HeadersInit = accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {};
                const res = await fetch(
                    `${identity.home_server}/messages/conversation?user_id=${encodeURIComponent(identity.user_id)}&other_user_id=${encodeURIComponent(selectedUserId)}`,
                    { headers }
                );
                if (res.ok) {
                    const data = await res.json();
                    const msgs: Message[] = data.messages || [];
                    setMessages(msgs);
                    cache.setMessages(identity.user_id, selectedUserId, msgs);
                }
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        };

        run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity, selectedUserId]);

    // ── Auto-scroll to bottom of message thread ───────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Background poll: process PROFILE_UPDATE notifications ─────────────────
    // When another user updates their profile, the backend inserts a
    // PROFILE_UPDATE notification for their followers + message contacts.
    // We poll every 60 s, evict the stale entry, and the next SWR access
    // re-fetches fresh data automatically.
    useEffect(() => {
        if (!identity) return;

        const pollProfileUpdates = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const headers: HeadersInit = accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {};
                const res = await fetch(
                    `${identity.home_server}/notifications?user_id=${encodeURIComponent(identity.user_id)}`,
                    { headers }
                );
                if (!res.ok) return;

                const data = await res.json();
                const notifications: Array<{ id: string; type: string; title: string; is_read: boolean }> =
                    data.notifications || [];

                const profileUpdates = notifications.filter(
                    n => n.type === 'PROFILE_UPDATE' && !n.is_read
                );

                for (const n of profileUpdates) {
                    // title holds the actor's user_id (written by BroadcastProfileUpdate)
                    if (n.title) {
                        cache.invalidateProfile(n.title);
                        // Reload if currently visible in conversation panel or sidebar
                        if (n.title === selectedUserId || profiles[n.title]) {
                            loadProfile(n.title);
                        }
                    }
                    // Mark as read so we don't reprocess on next poll
                    if (n.id) {
                        fetch(`${identity.home_server}/notifications/read`, {
                            method: 'POST',
                            headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notification_id: n.id, user_id: identity.user_id }),
                        }).catch(() => {});
                    }
                }
            } catch {
                // Silently ignore polling errors
            }
        };

        notifPollRef.current = setInterval(pollProfileUpdates, 60_000);
        return () => {
            if (notifPollRef.current) clearInterval(notifPollRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity, selectedUserId]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !identity || !selectedUserId) return;

        setSending(true);
        try {
            const accessToken = localStorage.getItem('access_token');
            const res = await fetch(`${identity.home_server}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    from: identity.user_id,
                    to: selectedUserId,
                    content: newMessage,
                }),
            });

            if (res.ok) {
                const newMsg: Message = {
                    id: Date.now().toString(),
                    sender: identity.user_id,
                    receiver: selectedUserId,
                    content: newMessage,
                    created_at: new Date().toISOString(),
                };
                const updated = [...messages, newMsg];
                setMessages(updated);
                // Persist to cache immediately so the thread is saved locally
                cache.setMessages(identity.user_id, selectedUserId, updated);
                setNewMessage('');
            } else {
                const errorText = await res.text();
                console.error('Failed to send message:', errorText);
                alert(`Failed to send message: ${errorText}`);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getDisplayName = (userId: string | undefined) => {
        if (!userId) return 'Unknown';
        return profiles[userId]?.profile?.display_name || userId.split('@')[0];
    };

    const getAvatarUrl = (userId: string | undefined) => {
        if (!userId) return null;
        return profiles[userId]?.profile?.avatar_url || null;
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-full min-h-64 items-center justify-center">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow" />
                    <p className="mt-2">Loading messages...</p>
                </div>
            </div>
        );
    }

    // ── Avatar component ──────────────────────────────────────────────────────
    const UserAvatar = ({ userId, size = 40 }: { userId: string; size?: number }) => {
        const avatarUrl = getAvatarUrl(userId);
        const initials = getDisplayName(userId).charAt(0).toUpperCase();
        return avatarUrl ? (
            <Image
                src={avatarUrl}
                alt={userId}
                width={size}
                height={size}
                className="rounded-full object-cover"
                style={{ width: size, height: size }}
            />
        ) : (
            <div
                className="rounded-full bg-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold shrink-0"
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                {initials}
            </div>
        );
    };

    const selectedProfile = profiles[selectedUserId ?? '']?.profile;

    return (
        <div className="flex h-full">
            {/* ── Left: conversation list ── */}
            <div className="w-80 border-r border-bat-gray/10 bg-bat-dark flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-bat-gray/10">
                    <h1 className="text-2xl font-bold text-bat-gray">Messages</h1>
                </div>

                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                    {fetchError ? (
                        <div className="m-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30">
                            <p className="text-red-400 text-xs font-semibold mb-1">Failed to load</p>
                            <p className="text-red-300/70 text-xs break-all">{fetchError}</p>
                            <button
                                onClick={() => { setFetchError(null); setRetryKey(k => k + 1); }}
                                className="mt-2 text-xs text-bat-yellow hover:underline"
                            >Retry</button>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <p className="text-bat-gray/50 text-sm">No conversations yet</p>
                            <p className="text-bat-gray/30 text-xs text-center px-4">Send a message to someone to start a conversation</p>
                        </div>
                    ) : (
                        conversations.filter(conv => !!conv.other_user).map(conv => {
                            const isSelected = selectedUserId === conv.other_user;
                            const timeStr = conv.created_at
                                ? new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '';
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedUserId(conv.other_user)}
                                    className={[
                                        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                                        isSelected
                                            ? 'bg-bat-yellow/15 border border-bat-yellow/40 shadow-md'
                                            : 'bg-[#0B0C10] border border-white/5 hover:border-white/15 hover:bg-[#13151a]',
                                    ].join(' ')}
                                >
                                    <div className="shrink-0">
                                        <UserAvatar userId={conv.other_user} size={44} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <p className={`font-semibold truncate text-sm ${isSelected ? 'text-bat-yellow' : 'text-bat-gray'}`}>
                                                {getDisplayName(conv.other_user)}
                                            </p>
                                            {timeStr && (
                                                <span className="text-bat-gray/40 text-xs shrink-0">{timeStr}</span>
                                            )}
                                        </div>
                                        <Link
                                            href={`/search?user_id=${encodeURIComponent(conv.other_user)}`}
                                            onClick={e => e.stopPropagation()}
                                            className="text-bat-yellow/50 text-xs hover:text-bat-yellow hover:underline truncate block leading-tight"
                                        >
                                            {conv.other_user}
                                        </Link>
                                        <p className="text-bat-gray/40 text-xs truncate mt-0.5">
                                            {conv.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Center: message thread ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedUserId ? (
                    <>
                        {/* Conversation header */}
                        <div className="p-4 border-b border-bat-gray/10 bg-bat-dark flex items-center gap-3">
                            <UserAvatar userId={selectedUserId} size={38} />
                            <div>
                                <p className="text-bat-gray font-bold leading-tight">
                                    {getDisplayName(selectedUserId)}
                                </p>
                                <Link
                                    href={`/search?user_id=${encodeURIComponent(selectedUserId)}`}
                                    className="text-bat-yellow/70 text-xs hover:text-bat-yellow hover:underline"
                                >
                                    {selectedUserId}
                                </Link>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-end gap-2 ${msg.sender === identity?.user_id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.sender !== identity?.user_id && (
                                            <div className="shrink-0 mb-1">
                                                <UserAvatar userId={msg.sender} size={28} />
                                            </div>
                                        )}
                                        <div className={`px-4 py-2 rounded-2xl max-w-xs text-sm ${
                                            msg.sender === identity?.user_id
                                                ? 'bg-bat-yellow text-bat-black rounded-br-sm'
                                                : 'bg-bat-dark text-bat-gray rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                            <p className="text-xs opacity-50 mt-1 text-right">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-bat-gray/10 bg-bat-dark">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="
                                        flex-1 px-4 py-3 rounded-lg
                                        bg-bat-black text-white
                                        border border-bat-gray/20
                                        focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                        outline-none transition-all duration-200
                                        placeholder-gray-600
                                    "
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    disabled={sending}
                                />
                                <button
                                    className="
                                        px-6 py-3 rounded-lg font-bold
                                        bg-bat-yellow text-bat-black
                                        hover:bg-yellow-400
                                        transition-all duration-200
                                        disabled:opacity-50
                                    "
                                    onClick={handleSendMessage}
                                    disabled={sending || !newMessage.trim()}
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <svg
                                className="w-24 h-24 mx-auto text-gray-600 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <p className="text-gray-500 text-lg">
                                Select a conversation to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right: selected user profile panel ── */}
            {selectedUserId && (
                <div className="w-72 border-l border-bat-gray/10 bg-bat-dark flex flex-col">
                    <div className="p-5 border-b border-bat-gray/10">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Profile
                        </h2>
                    </div>

                    <div className="p-5 flex flex-col items-center gap-3 border-b border-bat-gray/10">
                        {/* Large avatar */}
                        {selectedProfile?.avatar_url ? (
                            <Image
                                src={selectedProfile.avatar_url}
                                alt={selectedUserId}
                                width={80}
                                height={80}
                                className="rounded-full object-cover ring-2 ring-bat-yellow/30"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-bat-yellow/20 flex items-center justify-center text-bat-yellow text-3xl font-bold ring-2 ring-bat-yellow/30">
                                {getDisplayName(selectedUserId).charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Display name */}
                        <p className="text-bat-gray font-bold text-lg text-center leading-tight">
                            {getDisplayName(selectedUserId)}
                        </p>

                        {/* Clickable user_id → profile */}
                        <Link
                            href={`/search?user_id=${encodeURIComponent(selectedUserId)}`}
                            className="text-bat-yellow/80 text-sm hover:text-bat-yellow hover:underline text-center break-all"
                        >
                            {selectedUserId}
                        </Link>

                        <Link
                            href={`/search?user_id=${encodeURIComponent(selectedUserId)}`}
                            className="mt-1 px-4 py-2 rounded-lg border border-bat-yellow/40 text-bat-yellow text-sm hover:bg-bat-yellow/10 transition-colors"
                        >
                            View Profile
                        </Link>
                    </div>

                    {/* Bio */}
                    {selectedProfile?.bio && (
                        <div className="p-5 border-b border-bat-gray/10">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Bio
                            </p>
                            <p className="text-bat-gray text-sm leading-relaxed">{selectedProfile.bio}</p>
                        </div>
                    )}

                    {/* Follower / Following counts */}
                    {(selectedProfile?.followers_count !== undefined ||
                        selectedProfile?.following_count !== undefined) && (
                        <div className="p-5 flex justify-around">
                            <div className="text-center">
                                <p className="text-bat-yellow font-bold text-lg">
                                    {selectedProfile?.followers_count ?? 0}
                                </p>
                                <p className="text-gray-500 text-xs">Followers</p>
                            </div>
                            <div className="text-center">
                                <p className="text-bat-yellow font-bold text-lg">
                                    {selectedProfile?.following_count ?? 0}
                                </p>
                                <p className="text-gray-500 text-xs">Following</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full min-h-64 items-center justify-center">
                    <div className="text-center text-bat-gray">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow" />
                        <p className="mt-2">Loading messages...</p>
                    </div>
                </div>
            }
        >
            <MessagesContent />
        </Suspense>
    );
}
