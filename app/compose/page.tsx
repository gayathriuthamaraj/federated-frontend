"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ComposePage() {
    const { identity } = useAuth();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setUploadError(null);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile || !identity) return null;
        const form = new FormData();
        form.append('image', imageFile);
        const res = await fetch(`${identity.home_server}/upload/image`, {
            method: 'POST',
            body: form,
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => 'Upload failed');
            throw new Error(errText);
        }
        const data = await res.json();
        // Prefix the server URL so the image is fully qualified
        return `${identity.home_server}${data.url}`;
    };

    const handlePost = async () => {
        if ((!content.trim() && !imageFile) || !identity) return;

        setPosting(true);
        setUploadError(null);
        try {
            let imageURL: string | null = null;
            if (imageFile) {
                imageURL = await uploadImage();
            }

            const res = await fetch(`${identity.home_server}/post/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: identity.user_id,
                    content: content,
                    ...(imageURL ? { image_url: imageURL } : {}),
                }),
            });

            if (res.ok) {
                router.push('/feed');
            } else {
                const errText = await res.text().catch(() => 'Failed to create post');
                alert(errText);
            }
        } catch (err: any) {
            console.error('Post creation error:', err);
            setUploadError(err?.message || 'Failed to create post');
        } finally {
            setPosting(false);
        }
    };

    useEffect(() => {
        if (!identity) {
            router.push('/login');
        }
    }, [identity, router]);

    if (!identity) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Back + title */}
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

            {/* Compose card */}
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
                        min-h-45
                    "
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={posting}
                    autoFocus
                />

                {/* Image preview */}
                {imagePreview && (
                    <div className="mt-3 relative rounded-xl overflow-hidden border border-bat-gray/20">
                        <Image
                            src={imagePreview}
                            alt="Preview"
                            width={600}
                            height={400}
                            className="w-full max-h-80 object-contain bg-bat-black"
                            unoptimized
                        />
                        <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bat-black/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Remove image"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {uploadError && (
                    <p className="mt-2 text-sm text-red-400">{uploadError}</p>
                )}

                {/* Toolbar + actions */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Image attach button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={posting}
                            title="Attach image"
                            className="p-2 rounded-full text-bat-yellow/60 hover:text-bat-yellow hover:bg-bat-yellow/10 transition-colors disabled:opacity-40"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                        <span className="text-sm text-bat-gray/60">
                            {content.length} characters
                        </span>
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
                            disabled={posting || (!content.trim() && !imageFile)}
                        >
                            {posting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-bat-dark/50 rounded-lg border border-bat-gray/10">
                <h3 className="font-bold text-bat-gray mb-2">Tips</h3>
                <ul className="text-sm text-bat-gray/60 space-y-1">
                    <li>• Keep it concise and engaging</li>
                    <li>• Use @mentions to tag other users</li>
                    <li>• Add #hashtags for discoverability</li>
                    <li>• Attach an image (JPEG, PNG, GIF, WebP — max 10 MB)</li>
                </ul>
            </div>
        </div>
    );
}
