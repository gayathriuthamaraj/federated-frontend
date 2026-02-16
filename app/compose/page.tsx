"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ComposePage() {
    const { identity } = useAuth();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);

    const handlePost = async () => {
        if (!content.trim() || !identity) return;

        setPosting(true);
        try {
            const res = await fetch(`${identity.home_server}/post/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    content: content,
                }),
            });

            if (res.ok) {
                
                router.push('/feed');
            } else {
                alert('Failed to create post');
            }
        } catch (err) {
            console.error('Post creation error:', err);
            alert('Failed to create post');
        } finally {
            setPosting(false);
        }
    };

    if (!identity) {
        router.push('/login');
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-bat-gray hover:text-bat-yellow transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-bat-gray">Compose Post</h1>
            </div>

            {}
            <div className="bg-bat-dark rounded-lg border border-bat-gray/10 p-6">
                <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-bat-dark border border-bat-yellow/50 flex items-center justify-center text-bat-yellow font-bold text-lg">
                        {identity.user_id.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-bat-gray">{identity.user_id.split('@')[0]}</p>
                        <p className="text-sm text-bat-gray/60">{identity.user_id}</p>
                    </div>
                </div>

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
                        min-h-[200px]
                    "
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={posting}
                    autoFocus
                />

                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-bat-gray/60">
                        {content.length} characters
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="
                                px-6 py-2 rounded-full font-bold
                                border border-bat-gray/20 text-bat-gray
                                hover:border-bat-gray/40
                                transition-all duration-200
                            "
                            disabled={posting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePost}
                            className="
                                px-6 py-2 rounded-full font-bold
                                bg-bat-yellow text-bat-black
                                hover:bg-yellow-400
                                transform active:scale-95
                                transition-all duration-200
                                shadow-[0_0_15px_rgba(245,197,24,0.3)]
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                            disabled={posting || !content.trim()}
                        >
                            {posting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>

            {}
            <div className="mt-6 p-4 bg-bat-dark/50 rounded-lg border border-bat-gray/10">
                <h3 className="font-bold text-bat-gray mb-2">Tips</h3>
                <ul className="text-sm text-bat-gray/60 space-y-1">
                    <li>• Keep it concise and engaging</li>
                    <li>• Use @mentions to tag other users</li>
                    <li>• Add #hashtags for discoverability</li>
                </ul>
            </div>
        </div>
    );
}
