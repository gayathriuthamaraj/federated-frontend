"use client";

import { useState, useEffect } from 'react';
import PostCard from '../../components/PostCard';
import { mockPosts, mockUsers } from '../../data/mockData';
import { Post } from '@/types/post';

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);

    // Simulate fetch feed
    useEffect(() => {
        const timer = setTimeout(() => {
            // Convert MockPost to Post type
            const mappedPosts: Post[] = mockPosts.map(post => ({
                id: post.id,
                author: post.author,
                content: post.content,
                image_url: post.imageUrl,
                created_at: post.created_at,
                updated_at: post.updated_at,
                like_count: post.likeCount,
                reply_count: post.commentCount,
                repost_count: post.repostCount,
                has_liked: post.isLiked,
                has_reposted: post.isReposted,
                reply_to: (post as any).replyTo,
                is_repost: false
            }));
            setPosts(mappedPosts);
            setLoading(false);
        }, 800); // Simulate network delay

        return () => clearTimeout(timer);
    }, []);

    // Handle post creation
    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;

        setPosting(true);

        // Simulate API call
        setTimeout(() => {
            const newPost: Post = {
                id: `new-${Date.now()}`,
                author: 'guest@showcase',
                content: newPostContent,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                like_count: 0,
                reply_count: 0,
                repost_count: 0,
                has_liked: false,
                has_reposted: false,
            };

            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setPosting(false);
        }, 500);
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Feed</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {/* Compose Box */}
            <div className="mb-6 p-4 bg-bat-dark rounded-lg border border-bat-gray/10">
                <textarea
                    placeholder="What's happening in Gotham? (Mock Mode)"
                    className="
              w-full px-4 py-3 rounded-lg
              bg-bat-black text-white
              border border-bat-gray/20
              focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
              outline-none transition-all duration-200
              placeholder-gray-600
              resize-none
            "
                    rows={3}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={posting}
                />
                <div className="flex justify-end mt-3">
                    <button
                        className="
              px-6 py-2 rounded-full font-bold
              bg-bat-yellow text-bat-black
              hover:bg-yellow-400
              transform active:scale-95
              transition-all duration-200
              shadow-[0_0_15px_rgba(245,197,24,0.3)]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
                        onClick={handleCreatePost}
                        disabled={posting || !newPostContent.trim()}
                    >
                        {posting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            {posts.length === 0 ? (
                <div className="text-center py-12 text-bat-gray">
                    <p className="text-lg">No posts yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {/* Load More */}
            <div className="mt-6 text-center">
                <button className="
            px-6 py-3 rounded-full font-bold
            bg-bat-dark text-bat-gray
            border border-bat-gray/20
            hover:border-bat-yellow/50
            transition-all duration-200
          ">
                    Load More Posts
                </button>
            </div>
        </div>
    );
}
