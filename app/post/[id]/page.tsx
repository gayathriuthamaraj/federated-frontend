"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/PostCard';
import type { Post } from '../../types/post';

function PostDetailContent() {
    const { identity } = useAuth();
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!identity || !postId) return;
        const fetchPost = async () => {
            try {
                const res = await fetch(
                    `${identity.home_server}/post/get?post_id=${encodeURIComponent(postId)}&viewer_id=${encodeURIComponent(identity.user_id)}`
                );
                if (!res.ok) throw new Error(`Post not found (${res.status})`);
                const data = await res.json();
                setPost(data.post);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Failed to load post');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [identity, postId]);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-2xl mx-auto px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← Back
                </button>

                {loading && (
                    <div className="text-center text-gray-400 py-16">Loading post…</div>
                )}

                {!loading && error && (
                    <div className="text-center text-red-400 py-16">{error}</div>
                )}

                {!loading && post && (
                    <PostCard post={post} initialShowComments={true} />
                )}
            </div>
        </div>
    );
}

export default function PostDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading…</div>}>
            <PostDetailContent />
        </Suspense>
    );
}
