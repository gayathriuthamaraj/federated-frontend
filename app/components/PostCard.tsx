"use client";

import { Post } from '@/types/post';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

interface PostCardProps {
    post: Post;
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

export default function PostCard({ post }: PostCardProps) {
    const { identity } = useAuth();

    
    const [isLiked, setIsLiked] = useState(post.has_liked || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [likePopKey, setLikePopKey] = useState(0);
    const [isReposted, setIsReposted] = useState(post.has_reposted || false);
    const [repostCount, setRepostCount] = useState(post.repost_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Reply[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null); 
    const [replyText, setReplyText] = useState(''); 

    const displayName = post.author.split('@')[0];
    const handle = `@${post.author}`;

    const date = new Date(post.created_at);
    const timeAgo = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });

    
    useEffect(() => {
        if (showComments && post.id && identity) {
            fetchReplies();
        }
    }, [showComments, post.id, identity]);

    const fetchReplies = async () => {
        if (!identity) return;
        setLoadingComments(true);
        try {
            const res = await fetch(`${identity.home_server}/post/replies?post_id=${post.id}`);
            if (res.ok) {
                const data = await res.json();
                const rawReplies: Reply[] = data.replies || [];
                
                setComments(buildReplyTree(rawReplies));
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

        
        replies.forEach(r => {
            map[r.id] = { ...r, replies: [] };
        });

        
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

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        if (newLikedState) setLikePopKey((k) => k + 1);
        setLikeCount((prev: number) => newLikedState ? prev + 1 : prev - 1);

        try {
            const res = await fetch(`${identity.home_server}/post/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    post_id: post.id,
                }),
            });

            if (!res.ok) {
                
                setIsLiked(!newLikedState);
                setLikeCount((prev: number) => newLikedState ? prev - 1 : prev + 1);
            }
        } catch (err) {
            console.error('Like error:', err);
            setIsLiked(!newLikedState);
            setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    const handleRepost = async () => {
        if (!identity) return;

        const newRepostedState = !isReposted;
        setIsReposted(newRepostedState);
        setRepostCount((prev: number) => newRepostedState ? prev + 1 : prev - 1);

        try {
            const res = await fetch(`${identity.home_server}/post/repost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    post_id: post.id,
                }),
            });

            if (!res.ok) {
                
                setIsReposted(!newRepostedState);
                setRepostCount((prev: number) => newRepostedState ? prev - 1 : prev + 1);
            }
        } catch (err) {
            console.error('Repost error:', err);
            setIsReposted(!newRepostedState);
            setRepostCount(prev => newRepostedState ? prev - 1 : prev + 1);
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
                    parent_id: parentId 
                }),
            });

            if (res.ok) {
                
                if (parentId) {
                    setReplyText('');
                    setReplyingTo(null);
                } else {
                    setCommentText('');
                }
                
                fetchReplies();
            }
        } catch (err) {
            console.error('Comment error:', err);
        }
    };

    
    const renderReply = (reply: Reply, depth: number = 0) => {
        const isReplying = replyingTo === reply.id;

        return (
            <div key={reply.id} className={`flex flex-col ${depth > 0 ? 'ml-8 mt-2 relative' : 'border-t border-bat-dark/30'}`}>
                {}
                {depth > 0 && (
                    <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-bat-dark/30"></div>
                )}
                {depth > 0 && (
                    <div className="absolute -left-6 top-6 w-4 h-0.5 bg-bat-dark/30"></div>
                )}

                <div className="flex gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-bat-blue/20 flex items-center justify-center text-bat-blue font-bold text-sm shrink-0">
                        {reply.user_id.split('@')[0][0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-gray-200 text-sm truncate">{reply.user_id.split('@')[0]}</span>
                            <span className="text-bat-gray/60 text-xs">· {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-bat-gray text-[15px] mt-0.5 whitespace-pre-wrap break-words">{reply.content}</p>

                        {}
                        <div className="flex gap-4 mt-2 text-bat-gray/50 text-xs">
                            <button
                                onClick={() => {
                                    setReplyingTo(isReplying ? null : reply.id);
                                    setReplyText(`@${reply.user_id.split('@')[0]} `);
                                }}
                                className="hover:text-bat-blue transition-colors"
                            >
                                Reply
                            </button>
                            <button className="hover:text-pink-600 transition-colors">Like</button>
                        </div>

                        {}
                        {isReplying && (
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Briefly reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleComment(reply.id)}
                                    autoFocus
                                    className="flex-1 bg-bat-black/50 border border-bat-dark rounded-md px-3 py-1.5 text-sm text-bat-gray focus:border-bat-blue outline-none"
                                />
                                <button
                                    onClick={() => handleComment(reply.id)}
                                    disabled={!replyText.trim()}
                                    className="px-3 py-1.5 rounded-md bg-bat-blue text-white text-xs font-bold disabled:opacity-50"
                                >
                                    Reply
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {}
                {reply.replies && reply.replies.length > 0 && (
                    <div className={depth === 0 ? "" : ""}>
                        {reply.replies.map(child => renderReply(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <article className="border-b border-bat-dark hover:bg-bat-dark/30 transition-colors duration-200 animate-fade-up">
            <div className="flex gap-3 px-4 py-3">
                {}
                <div className="flex-shrink-0">
                    <Link
                        href={`/profile?user_id=${encodeURIComponent(post.author)}`}
                        className="flex h-10 w-10 rounded-full bg-bat-dark border border-bat-dark items-center justify-center text-bat-yellow font-bold text-lg select-none transition-transform duration-200 hover:scale-110"
                    >
                        {displayName[0].toUpperCase()}
                    </Link>
                </div>

                {}
                <div className="flex-1 min-w-0">
                    {}
                    <div className="flex items-baseline gap-1.5 text-[15px] leading-5">
                        <Link
                            href={`/profile?user_id=${encodeURIComponent(post.author)}`}
                            className="font-bold text-gray-200 truncate hover:underline"
                        >
                            {displayName}
                        </Link>
                        <span className="text-bat-gray/60 truncate">
                            {handle}
                        </span>
                        <span className="text-bat-gray/60 text-xs">
                            · {timeAgo}
                        </span>
                    </div>

                    {}
                    <div className="mt-0.5 text-[15px] text-bat-gray whitespace-pre-wrap leading-normal">
                        {post.content}
                    </div>

                    {}
                    {post.image_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-bat-gray/20">
                            <img src={post.image_url} alt="Post image" className="w-full" />
                        </div>
                    )}

                    {}
                    <div className="flex justify-between mt-3 text-bat-gray/50 max-w-md">
                        {}
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="group flex items-center gap-1.5 hover:text-bat-blue transition-colors"
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-bat-blue/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
                                    <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                                </svg>
                            </div>
                            <span className="text-xs font-medium">{comments.length > 0 ? comments.length : (post.reply_count || 0)}</span>
                        </button>

                        {}
                        <button
                            onClick={handleRepost}
                            className={`group flex items-center gap-1.5 transition-colors ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
                                    <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
                                </svg>
                            </div>
                            <span className="text-xs font-medium">{repostCount}</span>
                        </button>

                        {}
                        <button
                            onClick={handleLike}
                            className={`group flex items-center gap-1.5 transition-colors ${isLiked ? 'text-pink-600' : 'hover:text-pink-600'}`}
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-pink-600/10 transition-colors">
                                <svg key={likePopKey} viewBox="0 0 24 24" aria-hidden="true" className={`h-[1.15rem] w-[1.15rem] transition-all ${isLiked ? 'fill-current animate-like-pop' : 'fill-current'}`}>
                                    {isLiked ? (
                                        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                                    ) : (
                                        <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                                    )}
                                </svg>
                            </div>
                            <span className="text-xs font-medium">{likeCount}</span>
                        </button>

                        {}
                        <button className="group flex items-center gap-1.5 hover:text-bat-blue transition-colors">
                            <div className="p-1.5 rounded-full group-hover:bg-bat-blue/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
                                    <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.12 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path>
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {}
            {showComments && (
                <div className="border-t border-bat-dark/50 bg-bat-dark/10 animate-slide-up">
                    {}
                    <div className="flex gap-3 px-4 py-3">
                        <div className="h-8 w-8 rounded-full bg-bat-yellow/20 flex items-center justify-center text-bat-yellow font-bold text-sm">
                            Y
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Post your reply"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                                className="w-full bg-transparent text-bat-gray text-[15px] outline-none placeholder-bat-gray/40"
                            />
                        </div>
                        <button
                            onClick={() => handleComment()}
                            disabled={!commentText.trim()}
                            className="px-4 py-1.5 rounded-full bg-bat-yellow text-bat-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bat-yellow/90 transition-colors"
                        >
                            Reply
                        </button>
                    </div>

                    {}
                    {loadingComments && (
                        <div className="px-4 py-2 text-bat-gray/50 text-sm text-center">Loading replies...</div>
                    )}

                    {}
                    {comments.map((comment) => renderReply(comment))}

                    {!loadingComments && comments.length === 0 && (
                        <div className="px-4 py-6 text-center text-bat-gray/40 text-sm">
                            No replies yet. Be the first to reply!
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
