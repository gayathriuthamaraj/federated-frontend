"use client";

import { Post } from '@/types/post';
import { useState } from 'react';

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 500));
    const [isReposted, setIsReposted] = useState(false);
    const [repostCount, setRepostCount] = useState(Math.floor(Math.random() * 100));
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Array<{ id: string, author: string, text: string, replies: Array<{ id: string, author: string, text: string }> }>>([]);

    const displayName = post.author.split('@')[0];
    const handle = `@${post.author}`;

    const date = new Date(post.created_at);
    const timeAgo = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleRepost = () => {
        setIsReposted(!isReposted);
        setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
    };

    const handleComment = () => {
        if (commentText.trim()) {
            setComments([...comments, {
                id: Date.now().toString(),
                author: 'You',
                text: commentText,
                replies: []
            }]);
            setCommentText('');
        }
    };

    return (
        <article className="border-b border-bat-dark hover:bg-bat-dark/20 transition-colors">
            <div className="flex gap-3 px-4 py-3">
                {/* Left: Avatar */}
                <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-bat-dark border border-bat-dark flex items-center justify-center text-bat-yellow font-bold text-lg select-none">
                        {displayName[0].toUpperCase()}
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-baseline gap-1.5 text-[15px] leading-5">
                        <span className="font-bold text-gray-200 truncate">
                            {displayName}
                        </span>
                        <span className="text-bat-gray/60 truncate">
                            {handle}
                        </span>
                        <span className="text-bat-gray/60 text-xs">
                            · {timeAgo}
                        </span>
                    </div>

                    {/* Body */}
                    <div className="mt-0.5 text-[15px] text-bat-gray whitespace-pre-wrap leading-normal">
                        {post.content}
                    </div>

                    {/* Image if exists */}
                    {post.image_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-bat-gray/20">
                            <img src={post.image_url} alt="Post image" className="w-full" />
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-between mt-3 text-bat-gray/50 max-w-md">
                        {/* Reply/Comment */}
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="group flex items-center gap-1.5 hover:text-bat-blue transition-colors"
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-bat-blue/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.15rem] w-[1.15rem] fill-current">
                                    <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                                </svg>
                            </div>
                            <span className="text-xs font-medium">{comments.length}</span>
                        </button>

                        {/* Repost */}
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

                        {/* Like */}
                        <button
                            onClick={handleLike}
                            className={`group flex items-center gap-1.5 transition-colors ${isLiked ? 'text-pink-600' : 'hover:text-pink-600'}`}
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-pink-600/10 transition-colors">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-[1.15rem] w-[1.15rem] transition-all ${isLiked ? 'fill-current scale-110' : 'fill-current'}`}>
                                    {isLiked ? (
                                        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                                    ) : (
                                        <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                                    )}
                                </svg>
                            </div>
                            <span className="text-xs font-medium">{likeCount}</span>
                        </button>

                        {/* Share */}
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

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-bat-dark/50 bg-bat-dark/10">
                    {/* Comment Input */}
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
                            onClick={handleComment}
                            disabled={!commentText.trim()}
                            className="px-4 py-1.5 rounded-full bg-bat-yellow text-bat-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bat-yellow/90 transition-colors"
                        >
                            Reply
                        </button>
                    </div>

                    {/* Comments List */}
                    {comments.map((comment) => (
                        <div key={comment.id} className="border-t border-bat-dark/30">
                            <div className="flex gap-3 px-4 py-3">
                                <div className="h-8 w-8 rounded-full bg-bat-blue/20 flex items-center justify-center text-bat-blue font-bold text-sm">
                                    {comment.author[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-bold text-gray-200 text-sm">{comment.author}</span>
                                        <span className="text-bat-gray/60 text-xs">· just now</span>
                                    </div>
                                    <p className="text-bat-gray text-[15px] mt-0.5">{comment.text}</p>

                                    {/* Comment Actions */}
                                    <div className="flex gap-4 mt-2 text-bat-gray/50 text-xs">
                                        <button className="hover:text-bat-blue transition-colors">Reply</button>
                                        <button className="hover:text-pink-600 transition-colors">Like</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {comments.length === 0 && (
                        <div className="px-4 py-6 text-center text-bat-gray/40 text-sm">
                            No replies yet. Be the first to reply!
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
