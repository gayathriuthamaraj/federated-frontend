"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ComposePage() {
    const { identity } = useAuth();
    const router = useRouter();

    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identity) {
            setError('Not authenticated');
            return;
        }

        if (!content.trim()) {
            setError('Post content cannot be empty');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/post/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    content: content.trim(),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create post');
            }

            // Success - redirect to profile
            router.push('/profile');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/profile');
    };

    const charCount = content.length;
    const maxChars = 500;
    const isOverLimit = charCount > maxChars;

    return (
        <div className="min-h-screen bg-bat-black p-4 py-8">
            <div className="max-w-2xl mx-auto bg-bat-dark rounded-lg shadow-2xl border border-bat-gray/10">
                {/* Header */}
                <div className="p-8 border-b border-bat-gray/10">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Compose Post</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50 mb-3"></div>
                    <p className="text-sm text-gray-500">
                        Share your thoughts with Gotham
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Post Content */}
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-bat-gray mb-2">
                            What's happening?
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className={`
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white text-lg
                                border ${isOverLimit ? 'border-red-500' : 'border-bat-gray/20'}
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                                resize-none
                            `}
                            placeholder="Type your post here..."
                            autoFocus
                        />

                        {/* Character Count */}
                        <div className="mt-2 flex justify-end">
                            <span className={`text-sm ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
                                {charCount} / {maxChars}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-bat-gray/10">
                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim() || isOverLimit}
                            className="
                                flex-1 py-3 px-4 rounded-md font-bold text-lg
                                bg-bat-yellow text-bat-black
                                hover:bg-yellow-400
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transform active:scale-[0.98]
                                transition-all duration-200
                                shadow-[0_0_15px_rgba(245,197,24,0.3)]
                            "
                        >
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="
                                px-6 py-3 rounded-md font-medium
                                bg-bat-black text-bat-gray
                                border border-bat-gray/20
                                hover:border-bat-gray/40
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200
                            "
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Tips */}
                    <div className="pt-4 border-t border-bat-gray/10">
                        <h3 className="text-sm font-semibold text-bat-gray mb-2">💡 Tips</h3>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li>• Keep it concise and engaging</li>
                            <li>• Be respectful to others</li>
                            <li>• Maximum {maxChars} characters</li>
                        </ul>
                    </div>
                </form>
            </div>
        </div>
    );
}
