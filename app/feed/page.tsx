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
    const [feedLinkedAccounts, setFeedLinkedAccounts] = useState<{ url: string; label: string }[]>([]);
    const [feedSelectedServers, setFeedSelectedServers] = useState<Set<string>>(new Set());
    const [composeFocused, setComposeFocused] = useState(false);

    useEffect(() => {
        if (!identity) return;
        fetch(`${identity.home_server}/account/links?user_id=${encodeURIComponent(identity.user_id)}`)
            .then(r => r.ok ? r.json() : { links: [] })
            .then(data => {
                const links: Array<{ status: string; is_inbound: boolean; peer_server_url: string; requester_name: string; target_name: string; requester_id: string; target_id: string; }> = data.links ?? [];
                const accounts = links
                    .filter(l => l.status === 'confirmed' && l.peer_server_url)
                    .map(l => {
                        const peerName = l.is_inbound ? l.requester_name : l.target_name;
                        const peerId = l.is_inbound ? l.requester_id : l.target_id;
                        return { url: l.peer_server_url, label: peerName || peerId.split('@')[0] || l.peer_server_url.replace(/^https?:\/\//, '') };
                    });
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
        if (!authLoading && !identity) router.push('/login');
    }, [identity, authLoading, router]);

    useEffect(() => {
        async function fetchFeed() {
            if (!identity) { setLoading(false); return; }
            try {
                const res = await fetch(`${identity.home_server}/feed?user_id=${encodeURIComponent(identity.user_id)}&limit=20&offset=0`);
                if (!res.ok) throw new Error('Unable to load your feed right now.');
                const data = await res.json();
                setPosts(data.posts || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load your feed right now.');
            } finally { setLoading(false); }
        }
        if (identity) fetchFeed();
    }, [identity]);

    const handleCreatePost = async () => {
        if ((!newPostContent.trim() && !feedImageFile) || !identity) return;
        setPosting(true); setPostError(null);
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
                    setPosting(false); return;
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
            if (!res.ok) throw new Error('Failed to create post');
            const data = await res.json();
            if (data.status === 'post_flagged_and_hidden') {
                setFlaggedNotice('Your post has been flagged for moderation review and will not appear until a moderator approves it.');
                setNewPostContent(''); removeFeedImage(); return;
            }
            setNewPostContent(''); removeFeedImage(); setFeedSelectedServers(new Set()); setFlaggedNotice(null);
            setComposeFocused(false);
            const feedRes = await fetch(`${identity.home_server}/feed?user_id=${encodeURIComponent(identity.user_id)}&limit=20&offset=0`);
            if (feedRes.ok) { const feedData = await feedRes.json(); setPosts(feedData.posts || []); }
        } catch (err) {
            setPostError("Couldn't share your post. Please try again.");
        } finally { setPosting(false); }
    };

    const Skeleton = () => (
        <div className="flex min-h-full">
            <div className="flex-1 min-w-0 max-w-2xl px-4 py-4 space-y-3" style={{ borderRight: "1px solid var(--border)" }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
            </div>
            <div className="hidden xl:block w-80 shrink-0 px-6 py-4">
                <div className="skeleton h-48 rounded-2xl" />
            </div>
        </div>
    );

    if (authLoading || !identity) return <Skeleton />;
    if (loading) return <Skeleton />;

    if (error) {
        return (
            <div className="flex min-h-full">
                <div className="flex-1 min-w-0 max-w-2xl px-4 py-6" style={{ borderRight: "1px solid var(--border)" }}>
                    <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(194,65,12,0.07)", border: "1px solid rgba(194,65,12,0.25)", color: "var(--rose)" }}>
                        <p className="font-bold">Error loading feed</p>
                        <p className="mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full" style={{ background: "var(--bg)" }}>

            {/* ── Center column ── */}
            <div className="flex-1 min-w-0 max-w-2xl" style={{ borderRight: "1px solid var(--border)" }}>

                {/* Sticky frosted header */}
                <div className="sticky top-0 z-10 frosted-header px-5 py-3.5">
                    <div className="flex items-center justify-between">
                        <h1 className="font-bold text-[1.05rem] tracking-tight" style={{ color: "var(--text)" }}>Home</h1>
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetch(`${identity!.home_server}/feed?user_id=${encodeURIComponent(identity!.user_id)}&limit=20&offset=0`)
                                    .then(r => r.ok ? r.json() : null)
                                    .then(d => { if (d?.posts) setPosts(d.posts); })
                                    .finally(() => setLoading(false));
                            }}
                            className="p-2 rounded-full transition-all duration-200"
                            style={{ color: "var(--text-ghost)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                            title="Refresh feed"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Moderation flagged notice */}
                {flaggedNotice && (
                    <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm flex items-start gap-3 animate-slide-up"
                        style={{ background: "rgba(79,70,229,0.07)", border: "1px solid rgba(79,70,229,0.2)", color: "var(--amber)" }}>
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <span className="flex-1">{flaggedNotice}</span>
                        <button onClick={() => setFlaggedNotice(null)} style={{ color: "var(--amber)", opacity: 0.7 }}>✕</button>
                    </div>
                )}

                {/* Compose box */}
                <div
                    className="mx-4 my-4 rounded-2xl transition-all duration-300"
                    style={{
                        background: "var(--bg-panel)",
                        border: `1.5px solid ${composeFocused ? "var(--amber)" : "var(--border)"}`,
                        boxShadow: composeFocused ? "var(--shadow-amber), var(--shadow-md)" : "var(--shadow-sm)",
                        padding: "16px",
                    }}
                >
                    <div className="flex gap-3">
                        {/* Avatar */}
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))", boxShadow: "0 2px 8px var(--amber-glow)" }}
                        >
                            {identity.user_id.split('@')[0][0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <textarea
                                placeholder="What's happening in Gotham?"
                                className="w-full text-[15px] outline-none resize-none py-1 leading-relaxed"
                                style={{ background: "transparent", color: "var(--text)", caretColor: "var(--amber)" }}
                                rows={composeFocused ? 3 : 2}
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                onFocus={() => setComposeFocused(true)}
                                disabled={posting}
                            />

                            {/* Linked-account cross-posting */}
                            {feedLinkedAccounts.length > 0 && composeFocused && (
                                <div className="mt-2 flex flex-wrap gap-1.5 pb-1 animate-slide-up">
                                    <span className="text-[11px] self-center mr-0.5" style={{ color: "var(--text-ghost)" }}>Also post to:</span>
                                    {feedLinkedAccounts.map(({ url, label }) => {
                                        const checked = feedSelectedServers.has(url);
                                        return (
                                            <button key={url} type="button" title={url}
                                                onClick={() => {
                                                    setFeedSelectedServers(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(url)) next.delete(url); else next.add(url);
                                                        return next;
                                                    });
                                                }}
                                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-200"
                                                style={checked ? { background: "var(--amber-faint)", borderColor: "var(--amber)", color: "var(--amber)" } : { background: "transparent", borderColor: "var(--border)", color: "var(--text-ghost)" }}>
                                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
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
                                <div className="mt-2 relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                                    <Image src={feedImagePreview} alt="Preview" width={500} height={300}
                                        className="w-full max-h-60 object-contain" style={{ background: "var(--bg-raised)" }} unoptimized />
                                    <button onClick={removeFeedImage}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                        style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--rose)"}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.6)"}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {(composeFocused || newPostContent.length > 0) && (
                                <div className="flex items-center justify-between mt-3 pt-3 animate-slide-up" style={{ borderTop: "1px solid var(--border)" }}>
                                    <div className="flex items-center gap-1">
                                        {/* Image attach */}
                                        <button type="button" onClick={() => feedFileInputRef.current?.click()} disabled={posting}
                                            className="p-2 rounded-full transition-all duration-200"
                                            style={{ color: "var(--text-ghost)" }}
                                            title="Attach image"
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; (e.currentTarget as HTMLElement).style.background = "var(--amber-faint)"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <input ref={feedFileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFeedImageSelect} />

                                        {/* Visibility picker */}
                                        <div className="flex rounded-full overflow-hidden text-[11px] font-semibold ml-1" style={{ border: "1.5px solid var(--border)" }}>
                                            {(['PUBLIC', 'FOLLOWERS', 'CLOSE_FRIENDS'] as const).map(v => {
                                                const labels: Record<string, string> = { PUBLIC: '🌐', FOLLOWERS: '👥', CLOSE_FRIENDS: '💚' };
                                                const titles: Record<string, string> = { PUBLIC: 'Public', FOLLOWERS: 'Followers only', CLOSE_FRIENDS: 'Close friends' };
                                                return (
                                                    <button key={v} type="button" title={titles[v]} onClick={() => setFeedVisibility(v)}
                                                        className="px-2.5 py-1.5 transition-all duration-200"
                                                        style={feedVisibility === v ? { background: "var(--amber-faint)", color: "var(--amber)" } : { color: "var(--text-ghost)" }}>
                                                        {labels[v]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Char count */}
                                        {newPostContent.length > 0 && (
                                            <span className="text-xs tabular-nums" style={{ color: newPostContent.length > 480 ? "var(--rose)" : "var(--text-ghost)" }}>
                                                {500 - newPostContent.length}
                                            </span>
                                        )}
                                        <button onClick={handleCreatePost} disabled={posting || (!newPostContent.trim() && !feedImageFile)}
                                            className="btn-amber px-5 py-1.5 text-sm disabled:opacity-40">
                                            {posting ? (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                    </svg>
                                                    Posting…
                                                </span>
                                            ) : 'Post'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Post error notice */}
                {postError && (
                    <div className="mx-4 mb-3 px-4 py-3 rounded-xl text-sm flex items-center justify-between animate-slide-up"
                        style={{ background: "rgba(194,65,12,0.07)", border: "1px solid rgba(194,65,12,0.25)", color: "var(--rose)" }}>
                        <span>{postError}</span>
                        <button onClick={() => setPostError(null)} className="ml-2 shrink-0">✕</button>
                    </div>
                )}

                {/* Tab bar */}
                <div className="px-4 mb-2">
                    <div className="flex" style={{ borderBottom: "1.5px solid var(--border)" }}>
                        {['For you', 'Following'].map((tab, i) => (
                            <button key={tab}
                                className="px-4 py-2.5 text-sm font-semibold transition-all duration-200 relative"
                                style={{ color: i === 0 ? "var(--amber)" : "var(--text-ghost)" }}>
                                {tab}
                                {i === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "var(--amber)" }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feed posts */}
                {posts.length === 0 ? (
                    <div className="text-center py-20 animate-fade-up flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--amber-faint)" }}>
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--amber)" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <p className="text-base font-semibold" style={{ color: "var(--text-dim)" }}>Your feed is empty</p>
                        <p className="text-sm" style={{ color: "var(--text-ghost)" }}>Follow some users to see their posts here.</p>
                    </div>
                ) : (
                    <div>
                        {posts.map((post, i) => (
                            <div key={post.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                                <PostCard post={post} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Right panel ── */}
            <div className="hidden xl:block w-80 shrink-0 px-5 py-5">
                <div className="sticky top-5">
                    <RightPanel />
                </div>
            </div>
        </div>
    );
}
