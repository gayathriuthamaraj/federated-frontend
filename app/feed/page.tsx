"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import PostCard from '../components/PostCard';

export default function FeedPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !identity) {
            router.push('/login');
        }
    }, [identity, authLoading, router]);

    // Fetch feed
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
                    throw new Error(`Failed to fetch feed: ${res.status}`);
                }

                const data = await res.json();
                setPosts(data.posts || []);
            } catch (err) {
                console.error('Feed fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchFeed();
    }, [identity]);

    // Handle post creation
    const handleCreatePost = async () => {
        if (!newPostContent.trim() || !identity) return;

        setPosting(true);
        try {
            const res = await fetch(`${identity.home_server}/post/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    content: newPostContent,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to create post');
            }

            const data = await res.json();

            // Add new post to the top of the feed
            const newPost = {
                id: data.post_id,
                author: identity.user_id,
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
        } catch (err) {
            console.error('Post creation error:', err);
            alert('Failed to create post');
        } finally {
            setPosting(false);
        }
    };

    if (authLoading || !identity) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading...</p>
                </div>
            </div>
        );
    }

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

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                    <p className="font-bold">Error loading feed</p>
                    <p className="text-sm mt-1">{error}</p>
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
                    placeholder="What's happening in Gotham?"
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
                    <p className="text-sm mt-2">Follow some users to see their posts here!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {/* Load More */}
            {posts.length >= 20 && (
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
            )}
        </div>
    );
}
