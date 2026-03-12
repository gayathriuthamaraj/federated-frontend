"use client";

import { Post } from '@/types/post';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCloseFriends } from '../context/CloseFriendsContext';
import Link from 'next/link';
import BlockButton from './BlockButton';

/** Renders post content with clickable #hashtag links. */
function PostContent({ content }: { content: string }) {
    const parts = content.split(/(#[A-Za-z0-9_]{1,100})/g);
    return (
        <>
            {parts.map((part, i) =>
                /^#[A-Za-z0-9_]+$/.test(part) ? (
                    <Link
                        key={i}
                        href={`/explore?tab=hashtag&tag=${encodeURIComponent(part.slice(1))}`}
                        className="text-bat-blue hover:underline"
                        onClick={e => e.stopPropagation()}
                    >
                        {part}
                    </Link>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

/** Displays a live countdown badge for ephemeral posts. */
function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
    const [label, setLabel] = useState('');

    useEffect(() => {
        const update = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) { setLabel('expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            if (h > 0) setLabel(`${h}h ${m}m`);
            else if (m > 0) setLabel(`${m}m ${s}s`);
            else setLabel(`${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    if (!label) return null;
    return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-400/15 text-red-400 border border-red-400/30 shrink-0">
            ⏱ {label}
        </span>
    );
}

interface PostCardProps {
    post: Post;
    /** Base path for author profile links. Defaults to "/profile". Pass "/search" to keep navigation within search. */
    linkBase?: string;
    /** If true, the replies section will be open on initial render. */
    initialShowComments?: boolean;
}

interface Reply {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    parent_id?: string;
    created_at: string;
    replies?: Reply[];
}

export default function PostCard({ post, linkBase = '/search', initialShowComments = false }: PostCardProps) {
    const { identity, getAuthHeaders } = useAuth();
    const { closeFriends } = useCloseFriends();
    const isCloseFriend = closeFriends.has(post.author);

    const [isLiked, setIsLiked] = useState(post.has_liked || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [likePopKey, setLikePopKey] = useState(0);
    const [isReposted, setIsReposted] = useState(post.has_reposted || false);
    const [repostCount, setRepostCount] = useState(post.repost_count || 0);
    const [replyCount, setReplyCount] = useState(post.reply_count || 0);
    const [showComments, setShowComments] = useState(initialShowComments);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Reply[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [replyLikes, setReplyLikes] = useState<Map<string, { liked: boolean; count: number }>>(new Map());

    // Edit / delete own post states
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editError, setEditError] = useState('');
    const [isDeleted, setIsDeleted] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Sync like/repost state when the post prop is refreshed by the parent (e.g. after a feed re-fetch).
    // We key on post.id so a completely different post in the same slot also resets correctly.
    useEffect(() => {
        setIsLiked(post.has_liked || false);
        setLikeCount(post.like_count || 0);
    }, [post.id, post.has_liked, post.like_count]);

    useEffect(() => {
        setIsReposted(post.has_reposted || false);
        setRepostCount(post.repost_count || 0);
    }, [post.id, post.has_reposted, post.repost_count]);

    useEffect(() => {
        setReplyCount(post.reply_count || 0);
    }, [post.id, post.reply_count]);

    const displayName = post.author.split('@')[0];
    const handle = `@${post.author}`;
    const date = new Date(post.created_at);
    const timeAgo = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const isOwnPost = identity?.user_id === post.author;

    // Close overflow menu when clicking outside
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    useEffect(() => {
        if (showComments && post.id && identity) fetchReplies();
    }, [showComments, post.id, identity]);

    const fetchReplies = async () => {
        if (!identity) return;
        setLoadingComments(true);
        try {
            const res = await fetch(`${identity.home_server}/post/replies?post_id=${post.id}`);
            if (res.ok) {
                const data = await res.json();
                const flat: Reply[] = data.replies || [];
                setReplyCount(flat.length);
                setComments(buildReplyTree(flat));
            }
        } catch (err) {
            console.error('Failed to fetch replies:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const buildReplyTree = (replies: Reply[]): Reply[] => {
        const map: { [key: string]: Reply } = {};
        const roots: Reply[] = [];
        replies.forEach(r => { map[r.id] = { ...r, replies: [] }; });
        replies.forEach(r => {
            if (r.parent_id && map[r.parent_id]) {
                map[r.parent_id].replies?.push(map[r.id]);
            } else {
                roots.push(map[r.id]);
            }
        });
        return roots;
    };

    const handleLike = async () => {
        if (!identity) return;
        const next = !isLiked;
        setIsLiked(next);
        if (next) setLikePopKey(k => k + 1);
        setLikeCount((p: number) => next ? p + 1 : p - 1);
        try {
            const res = await fetch(`${identity.home_server}/post/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: identity.user_id, post_id: post.id }),
            });
            if (!res.ok) { setIsLiked(!next); setLikeCount((p: number) => next ? p - 1 : p + 1); }
        } catch {
            setIsLiked(!next);
            setLikeCount(p => next ? p - 1 : p + 1);
        }
    };

    const handleRepost = async () => {
        if (!identity) return;
        const next = !isReposted;
        setIsReposted(next);
        setRepostCount((p: number) => next ? p + 1 : p - 1);
        try {
            const res = await fetch(`${identity.home_server}/post/repost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: identity.user_id, post_id: post.id }),
            });
            if (!res.ok) { setIsReposted(!next); setRepostCount((p: number) => next ? p - 1 : p + 1); }
        } catch {
            setIsReposted(!next);
            setRepostCount(p => next ? p - 1 : p + 1);
        }
    };

    const handleComment = async (parentId?: string) => {
        const text = parentId ? replyText : commentText;
        if (!text.trim() || !identity) return;
        try {
            const res = await fetch(`${identity.home_server}/post/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    post_id: post.id,
                    content: text,
                    parent_id: parentId,
                }),
            });
            if (res.ok) {
                if (parentId) { setReplyText(''); setReplyingTo(null); } else { setCommentText(''); }
                setReplyCount(c => c + 1);
                fetchReplies();
            }
        } catch (err) {
            console.error('Comment error:', err);
        }
    };

    const handleLikeReply = async (replyId: string) => {
        if (!identity) return;
        const current = replyLikes.get(replyId) ?? { liked: false, count: 0 };
        const next = !current.liked;
        setReplyLikes(prev => new Map(prev).set(replyId, { liked: next, count: next ? current.count + 1 : Math.max(0, current.count - 1) }));
        try {
            const res = await fetch(`${identity.home_server}/post/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: identity.user_id, post_id: replyId }),
            });
            if (!res.ok) setReplyLikes(prev => new Map(prev).set(replyId, current));
        } catch {
            setReplyLikes(prev => new Map(prev).set(replyId, current));
        }
    };

    const handleSaveEdit = async () => {
        if (!identity || !editContent.trim()) return;
        setEditError('');
        try {
            const res = await fetch(`${identity.home_server}/post/edit`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ user_id: identity.user_id, post_id: post.id, content: editContent.trim() }),
            });
            if (res.ok) {
                post.content = editContent.trim();
                setIsEditing(false);
                setShowMenu(false);
            } else {
                setEditError("Couldn't save your edit. Please try again.");
            }
        } catch {
            setEditError("Couldn't save your edit. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (!identity) return;
        try {
            const res = await fetch(`${identity.home_server}/post/delete`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ user_id: identity.user_id, post_id: post.id }),
            });
            if (res.ok) {
                setIsDeleted(true);
                setShowMenu(false);
            } else {
                setDeleteConfirm(false);
            }
        } catch {
            setDeleteConfirm(false);
        }
    };

    /*  Branched thread renderer  */
    const renderReply = (reply: Reply, depth = 0) => {
        const hasChildren = (reply.replies?.length ?? 0) > 0;
        const isReplying = replyingTo === reply.id;
        const indent = Math.min(depth, 3) * 44;

        return (
            <div key={reply.id}>
                <div className="flex gap-3 py-2" style={{ paddingLeft: `${indent}px` }}>
                    {/* Avatar column — vertical thread line runs below if there are children */}
                    <div className="flex flex-col items-center w-9 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-bat-blue/10 border border-bat-blue/25 flex items-center justify-center text-bat-blue/90 font-semibold text-sm shrink-0">
                            {reply.user_id.split('@')[0][0].toUpperCase()}
                        </div>
                        {hasChildren && (
                            <div className="w-px flex-1 mt-1.5 min-h-4 rounded-full" style={{ background: 'rgba(100,116,139,0.3)' }} />
                        )}
                    </div>

                    {/* Reply content */}
                    <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-200 text-[13px] leading-5">
                                {reply.user_id.split('@')[0]}
                            </span>
                            <span className="text-bat-gray/40 text-[11px]">
                                 {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-[14px] text-bat-gray/85 mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {reply.content}
                        </p>
                        <div className="flex gap-5 mt-1.5">
                            <button
                                onClick={() => {
                                    setReplyingTo(isReplying ? null : reply.id);
                                    setReplyText(`@${reply.user_id.split('@')[0]} `);
                                }}
                                className="text-[12px] text-bat-gray/40 hover:text-bat-blue transition-colors"
                            >
                                Reply
                            </button>
                            <button
                                onClick={() => handleLikeReply(reply.id)}
                                className={`text-[12px] transition-colors flex items-center gap-1 ${
                                    replyLikes.get(reply.id)?.liked ? 'text-pink-400' : 'text-bat-gray/40 hover:text-pink-400'
                                }`}
                            >
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
                                    {replyLikes.get(reply.id)?.liked
                                        ? <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
                                        : <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
                                    }
                                </svg>
                                {replyLikes.get(reply.id)?.count ?? 0}
                            </button>
                        </div>
                        {isReplying && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    placeholder={`Reply to @${reply.user_id.split('@')[0]}...`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleComment(reply.id)}
                                    autoFocus
                                    className="flex-1 bg-bat-dark/60 border border-bat-gray/20 rounded-full px-3 py-1.5 text-sm text-bat-gray focus:border-bat-blue/50 outline-none"
                                />
                                <button
                                    onClick={() => handleComment(reply.id)}
                                    disabled={!replyText.trim()}
                                    className="px-4 py-1.5 rounded-full bg-bat-yellow text-bat-black text-xs font-bold disabled:opacity-40 hover:bg-yellow-400 transition-colors"
                                >
                                    Reply
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recurse children */}
                {hasChildren && reply.replies!.map(child => renderReply(child, depth + 1))}
            </div>
        );
    };

    /*  Post card  */
    if (isDeleted) {
        return (
            <article className="px-4 py-3 text-sm italic animate-fade-up" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-ghost)" }}>
                This post has been deleted.
            </article>
        );
    }

    return (
        <article
            className={`transition-all duration-150 animate-fade-up${isCloseFriend ? ' border-l-2' : ''}`}
            style={{
                borderBottom: "1px solid var(--border)",
                borderLeftColor: isCloseFriend ? "var(--teal)" : undefined,
                background: isCloseFriend ? "rgba(15,118,110,0.03)" : "var(--bg-panel)",
            }}
            onMouseEnter={e => { if (!isCloseFriend) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { if (!isCloseFriend) (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)"; }}
        >
            {/*
              ONE shared flex row: left avatar-column + right content-column.
              The left column's flex-1 thread line will grow to match the full
              height of the right column — which includes the reply section when
              comments are open — so the line visually connects post → replies.
            */}
            <div className="flex gap-3 px-4 pt-3 pb-3">

                {/* ── Left column: avatar + vertical thread line ── */}
                <div className="flex flex-col items-center shrink-0 w-10">
                    <Link
                        href={`${linkBase}?user_id=${encodeURIComponent(post.author)}`}
                        className="flex h-10 w-10 rounded-full items-center justify-center text-white font-bold text-lg select-none hover:scale-110 transition-all duration-200 shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))", boxShadow: "0 2px 8px var(--amber-glow)" }}
                    >
                        {displayName[0].toUpperCase()}
                    </Link>
                    {/* Thread line — grows to span post content + entire reply area */}
                    {showComments && (
                        <div className="w-px flex-1 mt-2 rounded-full" style={{ background: 'rgba(100,116,139,0.25)' }} />
                    )}
                </div>

                {/* ── Right column: post content + actions + inline reply section ── */}
                <div className="flex-1 min-w-0">

                    {/* Post header */}
                    <div className="flex items-baseline gap-1.5 text-[15px] leading-5">
                        <Link
                            href={`${linkBase}?user_id=${encodeURIComponent(post.author)}`}
                            className="font-bold truncate hover:underline" style={{ color: "var(--text)" }}
                        >
                            {displayName}
                        </Link>
                        <span className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{handle}</span>
                        <span className="text-xs ml-0.5" style={{ color: "var(--text-ghost)" }}>{timeAgo}</span>
                        {post.expires_at && (
                            <ExpiryBadge expiresAt={post.expires_at} />
                        )}
                        {post.origin_server &&
                            identity?.home_server &&
                            !post.origin_server.startsWith(identity.home_server) && (
                            <span
                                title={`Original post from ${post.origin_server}`}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0"
                            >
                                🌐 {post.origin_server.replace(/^https?:\/\//, '')}
                            </span>
                        )}
                        {post.replica_servers && post.replica_servers.length > 0 && (
                            post.replica_servers.map(s => (
                                <span
                                    key={s}
                                    title={`Also posted to ${s}`}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-bat-yellow/10 text-bat-yellow/60 border border-bat-yellow/20 shrink-0"
                                >
                                    🔗 {s.replace(/^https?:\/\//, '')}
                                </span>
                            ))
                        )}
                        {post.visibility === 'PUBLIC' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 bg-green-500/10 text-green-400 border-green-500/20">
                                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" aria-hidden="true">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                                Public
                            </span>
                        )}
                        {post.visibility && post.visibility !== 'PUBLIC' && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                post.visibility === 'FOLLOWERS'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                            }`}>
                                {post.visibility === 'FOLLOWERS' ? (
                                    <>
                                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" aria-hidden="true">
                                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                        </svg>
                                        Followers only
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" aria-hidden="true">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                        Close friends
                                    </>
                                )}
                            </span>
                        )}
                    </div>

                    {/* Post body */}
                    <div className="mt-1 text-[15px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-dim)" }}>
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    className="w-full rounded-xl px-3 py-2 text-[15px] outline-none resize-none min-h-20 transition-all"
                                    style={{ background: "var(--bg-raised)", border: "1.5px solid var(--border-lit)", color: "var(--text)" }}
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    autoFocus
                                />
                                {editError && <p className="text-red-400 text-xs">{editError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={!editContent.trim()}
                                        className="btn-amber px-4 py-1.5 text-sm disabled:opacity-40"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setEditContent(post.content); setEditError(''); }}
                                        className="px-4 py-1.5 rounded-full text-sm transition-colors"
                                        style={{ border: "1px solid var(--border-lit)", color: "var(--text-dim)", background: "transparent" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <PostContent content={post.content} />
                        )}
                    </div>

                    {post.image_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-bat-gray/15">
                            <img src={post.image_url} alt="Post image" className="w-full" />
                        </div>
                    )}

                    {/* Action bar */}
                    <div className="flex justify-between mt-2.5 max-w-xs" style={{ color: "var(--text-ghost)" }}>
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="group flex items-center gap-1.5 transition-colors"
                            style={{ color: showComments ? "#1D4ED8" : undefined }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#1D4ED8"}
                            onMouseLeave={e => { if (!showComments) (e.currentTarget as HTMLElement).style.color = ""; }}>
                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.1rem] w-[1.1rem] fill-current">
                                    <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium tabular-nums">
                                {replyCount}
                            </span>
                        </button>

                        {post.resharing_disabled ? (
                            <span
                                title="Author has disabled resharing"
                                className="group flex items-center gap-1.5 text-bat-gray/25 cursor-not-allowed select-none"
                            >
                                <div className="p-1.5 rounded-full">
                                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.1rem] w-[1.1rem] fill-current">
                                        <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium tabular-nums">{repostCount}</span>
                            </span>
                        ) : (
                        <button
                            onClick={handleRepost}
                            className={`group flex items-center gap-1.5 transition-colors ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.1rem] w-[1.1rem] fill-current">
                                    <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium tabular-nums">{repostCount}</span>
                        </button>
                        )}

                        <button
                            onClick={handleLike}
                            className={`group flex items-center gap-1.5 transition-colors ${isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
                                <svg key={likePopKey} viewBox="0 0 24 24" aria-hidden="true" className={`h-[1.1rem] w-[1.1rem] fill-current transition-transform ${isLiked ? 'animate-like-pop' : ''}`}>
                                    {isLiked ? (
                                        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
                                    ) : (
                                        <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
                                    )}
                                </svg>
                            </div>
                            <span className="text-xs font-medium tabular-nums">{likeCount}</span>
                        </button>

                        <button className="group flex items-center gap-1.5 hover:text-bat-blue transition-colors">
                            <div className="p-1.5 rounded-full group-hover:bg-bat-blue/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.1rem] w-[1.1rem] fill-current">
                                    <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.12 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
                                </svg>
                            </div>
                        </button>

                        {/* Overflow menu (⋯) */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(v => !v)}
                                className="group flex items-center p-1.5 rounded-full hover:bg-white/5 text-bat-gray/40 hover:text-bat-gray transition-colors"
                                aria-label="More options"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.1rem] w-[1.1rem] fill-current">
                                    <circle cx="5" cy="12" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="19" cy="12" r="2" />
                                </svg>
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 bottom-full mb-1 w-52 rounded-xl border border-bat-dark/60 bg-bat-black shadow-lg z-50 overflow-hidden">
                                    {isOwnPost ? (
                                        <>
                                            <button
                                                onClick={() => { setIsEditing(true); setEditContent(post.content); setShowMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-bat-gray hover:bg-bat-dark/60 transition-colors"
                                            >
                                                ✏️ Edit post
                                            </button>
                                            {deleteConfirm ? (
                                                <div className="px-4 py-2.5 flex flex-col gap-1.5">
                                                    <p className="text-xs text-bat-gray/70">Delete this post?</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleDelete}
                                                            className="flex-1 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(false)}
                                                            className="flex-1 px-3 py-1 rounded-full bg-bat-dark border border-bat-gray/20 text-bat-gray text-xs hover:bg-bat-dark/80 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(true)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-bat-dark/60 transition-colors"
                                                >
                                                    🗑️ Delete post
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <BlockButton
                                            targetUser={post.author}
                                            variant="menuitem"
                                            onSuccess={() => setShowMenu(false)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Inline reply section (inside same right column) ── */}
                    {showComments && (
                        <div className="mt-2 animate-slide-up">
                            {loadingComments && (
                                <div className="py-3 text-bat-gray/40 text-sm text-center">Loading replies...</div>
                            )}

                            {!loadingComments && comments.length === 0 && (
                                <div className="py-3 text-bat-gray/30 text-sm">No replies yet</div>
                            )}

                            {comments.map(comment => renderReply(comment))}

                            {/* Compose: new root-level reply, below all existing replies */}
                            <div className="flex gap-3 pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                                    style={{ background: "linear-gradient(135deg, var(--amber-light), var(--amber))" }}>
                                    {identity?.user_id ? identity.user_id.split('@')[0][0].toUpperCase() : 'Y'}
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Post your reply..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleComment()}
                                        className="flex-1 text-[15px] outline-none py-1"
                                        style={{ background: "transparent", color: "var(--text)", caretColor: "var(--amber)" }}
                                    />
                                    <button
                                        onClick={() => handleComment()}
                                        disabled={!commentText.trim()}
                                        className="btn-amber px-4 py-1.5 text-sm disabled:opacity-40 shrink-0"
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
