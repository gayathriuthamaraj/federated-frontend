"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import PostCard from '../components/PostCard';
import RightPanel from '../components/RightPanel';
import Image from 'next/image';
import { Post } from '@/types/post';

export default function FeedPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [feedImageFile, setFeedImageFile] = useState<File | null>(null);
    const [feedImagePreview, setFeedImagePreview] = useState<string | null>(null);
    const feedFileInputRef = useRef<HTMLInputElement>(null);

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
                    throw new Error(`Failed to fetch feed: ${res.status}`);
                }

                const data = await res.json();
                setPosts(data.posts || []);
            } catch (err) {
                console.error('Feed fetch error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load feed');
            } finally {
                setLoading(false);
            }
        }

        if (identity) fetchFeed();
    }, [identity]);


    const handleCreatePost = async () => {
        if ((!newPostContent.trim() && !feedImageFile) || !identity) return;

        setPosting(true);
        try {
            let imageURL: string | null = null;
            if (feedImageFile) {
                const form = new FormData();
                form.append('file', feedImageFile);
                const upRes = await fetch(`${identity.home_server}/upload/image`, { method: 'POST', body: form });
                if (upRes.ok) {
                    const upData = await upRes.json();
                    imageURL = `${identity.home_server}${upData.url}`;
                } else {
                    const errText = await upRes.text().catch(() => 'Upload failed');
                    alert(`Image upload failed: ${errText}`);
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
                    ...(imageURL ? { image_url: imageURL } : {}),
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to create post');
            }

            const data = await res.json();


            const newPost = {
                id: data.post_id,
                author: identity.user_id,
                content: newPostContent,
                image_url: imageURL ?? undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                like_count: 0,
                reply_count: 0,
                repost_count: 0,
                has_liked: false,
                has_reposted: false,
            };

            setPosts((prev) => [newPost as Post, ...prev]);
            setNewPostContent('');
            removeFeedImage();
        } catch (err) {
            console.error('Post creation error:', err);
            alert('Failed to create post');
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
