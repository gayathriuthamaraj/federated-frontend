"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import PostCard from '../components/PostCard';
import RightPanel from '../components/RightPanel';
import Image from 'next/image';

export default function FeedPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [feedImageFile, setFeedImageFile] = useState<File | null>(null);
    const [feedImagePreview, setFeedImagePreview] = useState<string | null>(null);
    const feedFileInputRef = useRef<HTMLInputElement>(null);
    const [flaggedNotice, setFlaggedNotice] = useState<string | null>(null);
    const [postError, setPostError] = useState<string | null>(null);
    const [feedVisibility, setFeedVisibility] = useState<'PUBLIC' | 'FOLLOWERS' | 'CLOSE_FRIENDS'>('PUBLIC');

    // Linked-account cross-posting
    const [feedLinkedAccounts, setFeedLinkedAccounts] = useState<{ url: string; label: string }[]>([]);
    const [feedSelectedServers, setFeedSelectedServers] = useState<Set<string>>(new Set());

    // Fetch confirmed linked accounts for cross-posting
    useEffect(() => {
        if (!identity) return;
        fetch(`${identity.home_server}/account/links?user_id=${encodeURIComponent(identity.user_id)}`)
            .then(r => r.ok ? r.json() : { links: [] })
            .then(data => {
                const links: Array<{
                    status: string;
                    is_inbound: boolean;
                    peer_server_url: string;
                    requester_name: string;
                    target_name: string;
                    requester_id: string;
                    target_id: string;
                }> = data.links ?? [];
                const accounts = links
                    .filter(l => l.status === 'confirmed' && l.peer_server_url)
                    .map(l => {
                        const peerName = l.is_inbound ? l.requester_name : l.target_name;
                        const peerId = l.is_inbound ? l.requester_id : l.target_id;
                        const label = peerName || peerId.split('@')[0] || l.peer_server_url.replace(/^https?:\/\//, '');
                        return { url: l.peer_server_url, label };
                    });
                // deduplicate by URL
                const seen = new Set<string>();
                setFeedLinkedAccounts(accounts.filter(a => seen.has(a.url) ? false : (seen.add(a.url), true)));
            })
            .catch(() => {});
    }, [identity]);

    const handleFeedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFeedImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setFeedImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeFeedImage = () => {
        setFeedImageFile(null);
        setFeedImagePreview(null);
        if (feedFileInputRef.current) feedFileInputRef.current.value = '';
    };

    
    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    
    useEffect(() => {
        async function fetchFeed() {
            if (!identity) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(
                    `${identity.home_server}/feed?user_id=${encodeURIComponent(identity.user_id)}&limit=20&offset=0`
                );

                if (!res.ok) {
                    throw new Error('Unable to load your feed right now.');
                }

                const data = await res.json();
                setPosts(data.posts || []);
            } catch (err) {
                console.error('Feed fetch error:', err);
                setError(err instanceof Error ? err.message : 'Unable to load your feed right now.');
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchFeed();
    }, [identity]);

    
    const handleCreatePost = async () => {
        if ((!newPostContent.trim() && !feedImageFile) || !identity) return;

        setPosting(true);
        setPostError(null);
        try {
            let imageURL: string | null = null;
            if (feedImageFile) {
                const form = new FormData();
                form.append('image', feedImageFile);
                const upRes = await fetch(`${identity.home_server}/upload/image`, { method: 'POST', body: form });
                if (upRes.ok) {
                    const upData = await upRes.json();
                    imageURL = `${identity.home_server}${upData.url}`;
                } else {
                    setPostError("Image couldn't be uploaded. Please try a different image.");
                    setPosting(false);
                    return;
                }
            }

            const res = await fetch(`${identity.home_server}/post/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    content: newPostContent,
                    visibility: feedVisibility,
                    ...(imageURL ? { image_url: imageURL } : {}),
                    ...(feedSelectedServers.size > 0 ? { linked_targets: [...feedSelectedServers] } : {}),
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to create post');
            }

            const data = await res.json();

            if (data.status === 'post_flagged_and_hidden') {
                setFlaggedNotice('Your post has been flagged for moderation review and will not appear until a moderator approves it.');
                setNewPostContent('');
                removeFeedImage();
                return;
            }

            // Re-fetch the full feed so the new post has accurate server data (counts, visibility, etc.)
            setNewPostContent('');
            removeFeedImage();
            setFeedSelectedServers(new Set());
            setFlaggedNotice(null);
            const feedRes = await fetch(
                `${identity.home_server}/feed?user_id=${encodeURIComponent(identity.user_id)}&limit=20&offset=0`
            );
            if (feedRes.ok) {
                const feedData = await feedRes.json();
                setPosts(feedData.posts || []);
            }
        } catch (err) {
            console.error('Post creation error:', err);
            setPostError("Couldn't share your post. Please try again.");
        } finally {
            setPosting(false);
        }
    };

    const Skeleton = () => (
        <div className="flex min-h-full">
            <div className="flex-1 min-w-0 max-w-165 border-r border-bat-dark/40 px-4 py-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
            </div>
            <div className="hidden xl:block w-90 shrink-0 px-6 py-4">
                <div className="skeleton h-48 rounded-2xl" />
            </div>
        </div>
    );

    if (authLoading || !identity) return <Skeleton />;
    if (loading) return <Skeleton />;

    if (error) {
        return (
            <div className="flex min-h-full">
                <div className="flex-1 min-w-0 max-w-165 border-r border-bat-dark/40 px-4 py-6">
                    <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 text-red-400">
                        <p className="font-bold">Error loading feed</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full">
            {/* â”€â”€ Center column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex-1 min-w-0 max-w-165 border-r border-bat-dark/40">
                {/* Sticky header */}
                <div className="sticky top-0 z-10 backdrop-blur-md bg-bat-black/85 border-b border-bat-dark/50 px-4 py-3">
                    <h1 className="font-bold text-[1.05rem] text-gray-100 tracking-tight">Home</h1>
                </div>

                {/* Moderation flagged notice */}
                {flaggedNotice && (
                    <div className="mx-4 mt-3 px-4 py-3 rounded-lg bg-yellow-900/30 border border-yellow-500/40 text-yellow-300 text-sm flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span>{flaggedNotice}</span>
                        <button onClick={() => setFlaggedNotice(null)} className="ml-auto shrink-0 text-yellow-400/60 hover:text-yellow-300">✕</button>
                    </div>
                )}

                {/* Compose box */}
                <div className="px-4 py-3 border-b border-bat-dark/40">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-bat-yellow/15 border border-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold text-lg shrink-0">
                            {identity.user_id.split('@')[0][0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <textarea
                                placeholder="What's happening in Gotham?"
                                className="w-full bg-transparent text-gray-100 text-[16px] placeholder-bat-gray/25 outline-none resize-none py-1 leading-relaxed"
                                rows={2}
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                disabled={posting}
                            />
                            {/* Linked-account cross-posting */}
                            {feedLinkedAccounts.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5 pb-1">
                                    <span className="text-[11px] text-bat-gray/40 self-center mr-0.5">Also post to:</span>
                                    {feedLinkedAccounts.map(({ url, label }) => {
                                        const checked = feedSelectedServers.has(url);
                                        return (
                                            <button
                                                key={url}
                                                type="button"
                                                title={url}
                                                onClick={() => {
                                                    setFeedSelectedServers(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(url)) next.delete(url);
                                                        else next.add(url);
                                                        return next;
                                                    });
                                                }}
                                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                                                    checked
                                                        ? 'bg-bat-yellow/15 border-bat-yellow/40 text-bat-yellow'
                                                        : 'bg-transparent border-bat-gray/20 text-bat-gray/50 hover:border-bat-gray/40'
                                                }`}
                                            >
                                                <svg className={`w-2.5 h-2.5 ${ checked ? 'text-bat-yellow' : 'text-bat-gray/30' }`} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                                </svg>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Image preview */}
                            {feedImagePreview && (
                                <div className="mt-2 relative rounded-xl overflow-hidden border border-bat-gray/20">
                                    <Image
                                        src={feedImagePreview}
                                        alt="Preview"
                                        width={500}
                                        height={300}
                                        className="w-full max-h-60 object-contain bg-bat-black"
                                        unoptimized
                                    />
                                    <button
                                        onClick={removeFeedImage}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-bat-black/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                                <button
                                    type="button"
                                    onClick={() => feedFileInputRef.current?.click()}
                                    disabled={posting}
                                    title="Attach image"
                                    className="p-1.5 rounded-full text-bat-yellow/50 hover:text-bat-yellow hover:bg-bat-yellow/10 transition-colors disabled:opacity-40"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <input
                                    ref={feedFileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={handleFeedImageSelect}
                                />
                                {/* Visibility mini-picker */}
                                <div className="flex rounded-full border border-bat-gray/15 overflow-hidden text-[11px] font-semibold">
                                    {(['PUBLIC', 'FOLLOWERS', 'CLOSE_FRIENDS'] as const).map(v => {
                                        const labels: Record<string, string> = { PUBLIC: '🌐', FOLLOWERS: '👥', CLOSE_FRIENDS: '💚' };
                                        const titles: Record<string, string> = { PUBLIC: 'Public', FOLLOWERS: 'Followers only', CLOSE_FRIENDS: 'Close friends' };
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                title={titles[v]}
                                                onClick={() => setFeedVisibility(v)}
                                                className={`px-2 py-1 transition-colors ${
                                                    feedVisibility === v
                                                        ? 'bg-bat-yellow/20 text-bat-yellow'
                                                        : 'text-bat-gray/40 hover:text-bat-gray/70'
                                                }`}
                                            >{labels[v]}</button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleCreatePost}
                                    disabled={posting || (!newPostContent.trim() && !feedImageFile)}
                                    className="px-5 py-1.5 rounded-full font-bold bg-bat-yellow text-bat-black text-sm hover:bg-yellow-400 active:scale-95 transition-all duration-150 disabled:opacity-40 shadow-[0_0_12px_rgba(245,197,24,0.2)]"
                                >
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Post error notice */}
                {postError && (
                    <div className="mx-4 mt-2 px-4 py-2 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
                        <span>{postError}</span>
                        <button onClick={() => setPostError(null)} className="ml-2 shrink-0 text-red-400/60 hover:text-red-300">✕</button>
                    </div>
                )}

                {/* Feed posts */}
                {posts.length === 0 ? (
                    <div className="text-center py-16 text-bat-gray/40 animate-fade-up">
                        <p className="text-base">No posts yet</p>
                        <p className="text-sm mt-1">Follow some users to see their posts here.</p>
                    </div>
                ) : (
                    <div className="animate-fade-up">
                        {posts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                )}
            </div>

            {/* â”€â”€ Right panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="hidden xl:block w-90 shrink-0 px-6 py-4">
                <div className="sticky top-4">
                    <RightPanel />
                </div>
            </div>
        </div>
    );
}
