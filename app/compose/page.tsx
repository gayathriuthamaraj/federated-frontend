"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { PostVisibility } from '../types/post';

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; description: string; icon: React.ReactNode }[] = [
    {
        value: 'PUBLIC',
        label: 'Public',
        description: 'Visible to everyone',
        icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
        ),
    },
    {
        value: 'FOLLOWERS',
        label: 'Followers only',
        description: 'Only your followers can see',
        icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
        ),
    },
    {
        value: 'CLOSE_FRIENDS',
        label: 'Close friends',
        description: 'Only your close friends list',
        icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        ),
    },
];

const VISIBILITY_COLORS: Record<PostVisibility, string> = {
    PUBLIC: 'text-green-400',
    FOLLOWERS: 'text-bat-blue',
    CLOSE_FRIENDS: 'text-pink-400',
};

export default function ComposePage() {
    const { identity } = useAuth();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState<string>('');
    const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
    const [visibilityOpen, setVisibilityOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selfDestructOpen, setSelfDestructOpen] = useState(false);

    // Linked-account multi-server publishing
    const [linkedServers, setLinkedServers] = useState<string[]>([]);
    const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());

    // Load confirmed linked account servers on mount
    useEffect(() => {
        if (!identity) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        fetch(`${identity.home_server}/account/links`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.ok ? r.json() : { links: [] })
            .then(data => {
                const links: Array<{ status: string; requester_id: string; target_id: string }> =
                    data.links ?? data ?? [];
                const servers = links
                    .filter(l => l.status === 'confirmed')
                    .map(l => {
                        // Pick the "other" user id — not the current user
                        const other = l.requester_id === identity.user_id ? l.target_id : l.requester_id;
                        // Extract server URL: user_id format is "user@host" or "user@host:port"
                        const parts = other.split('@');
                        if (parts.length < 2) return null;
                        const host = parts[parts.length - 1];
                        return host.startsWith('http') ? host : `http://${host}`;
                    })
                    .filter((s): s is string => s !== null);
                // deduplicate
                setLinkedServers([...new Set(servers)]);
            })
            .catch(() => {/* no linked accounts is fine */});
    }, [identity]);

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
                    visibility: visibility,
                    ...(imageURL ? { image_url: imageURL } : {}),
                    ...(expiresIn ? { expires_in: expiresIn } : {}),
                    ...(selectedServers.size > 0
                        ? { linked_targets: [...selectedServers] }
                        : {}),
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

                {/* Linked-account server publishing */}
                {linkedServers.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-bat-black/40 border border-bat-yellow/10">
                        <p className="text-xs font-semibold text-bat-gray/60 mb-2 uppercase tracking-wide">
                            Also publish to linked accounts:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {linkedServers.map(server => {
                                const checked = selectedServers.has(server);
                                const label = server.replace(/^https?:\/\//, '');
                                return (
                                    <button
                                        key={server}
                                        type="button"
                                        onClick={() => {
                                            setSelectedServers(prev => {
                                                const next = new Set(prev);
                                                if (next.has(server)) next.delete(server);
                                                else next.add(server);
                                                return next;
                                            });
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                            checked
                                                ? 'bg-bat-yellow/15 border-bat-yellow/50 text-bat-yellow'
                                                : 'bg-transparent border-bat-gray/20 text-bat-gray/60 hover:border-bat-gray/40'
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                                            checked ? 'bg-bat-yellow border-bat-yellow' : 'border-bat-gray/40'
                                        }`}>
                                            {checked && (
                                                <svg className="w-2 h-2 text-bat-black fill-current" viewBox="0 0 12 12">
                                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                                </svg>
                                            )}
                                        </span>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedServers.size > 0 && (
                            <p className="mt-2 text-xs text-bat-yellow/70">
                                Post will replicate to {selectedServers.size} linked server{selectedServers.size > 1 ? 's' : ''} — each stores its own copy.
                            </p>
                        )}
                    </div>
                )}
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

                        {/* Self-destruct timer button */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setSelfDestructOpen(o => !o)}
                                disabled={posting}
                                title="Set self-destruct timer"
                                className={`p-2 rounded-full transition-colors disabled:opacity-40 ${
                                    expiresIn
                                        ? 'text-red-400 bg-red-400/10'
                                        : 'text-bat-gray/60 hover:text-red-400 hover:bg-red-400/10'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            {selfDestructOpen && (
                                <div className="absolute bottom-10 left-0 z-20 bg-bat-dark border border-bat-gray/20 rounded-lg shadow-xl p-3 w-52">
                                    <p className="text-xs text-bat-gray/60 mb-2 font-semibold">Self-destruct after:</p>
                                    {[['', 'No expiry'], ['1h', '1 hour'], ['6h', '6 hours'], ['12h', '12 hours'], ['24h', '24 hours'], ['3d', '3 days'], ['7d', '7 days']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => { setExpiresIn(val); setSelfDestructOpen(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                                                expiresIn === val
                                                    ? 'bg-red-400/20 text-red-300'
                                                    : 'text-bat-gray hover:bg-bat-gray/10'
                                            }`}
                                        >
                                            {val === '' ? '✕ ' : '⏱ '}{label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <span className="text-sm text-bat-gray/60">
                            {content.length} characters
                        </span>
                        {expiresIn && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-400/15 text-red-400 border border-red-400/30">
                                ⏱ Deletes in {expiresIn}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* Visibility picker */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setVisibilityOpen(o => !o)}
                                disabled={posting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-40 ${
                                    visibility === 'PUBLIC'
                                        ? 'border-green-500/40 text-green-400 hover:bg-green-400/10'
                                        : visibility === 'FOLLOWERS'
                                        ? 'border-bat-blue/40 text-bat-blue hover:bg-bat-blue/10'
                                        : 'border-pink-500/40 text-pink-400 hover:bg-pink-400/10'
                                }`}
                                title="Post visibility"
                            >
                                <span className={VISIBILITY_COLORS[visibility]}>
                                    {VISIBILITY_OPTIONS.find(o => o.value === visibility)?.icon}
                                </span>
                                {VISIBILITY_OPTIONS.find(o => o.value === visibility)?.label}
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current opacity-60">
                                    <path d="M7 10l5 5 5-5z" />
                                </svg>
                            </button>
                            {visibilityOpen && (
                                <div className="absolute bottom-10 right-0 z-20 bg-bat-dark border border-bat-gray/20 rounded-lg shadow-xl p-1 w-56">
                                    {VISIBILITY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setVisibility(opt.value); setVisibilityOpen(false); }}
                                            className={`w-full text-left flex items-start gap-3 px-3 py-2 rounded-md transition-colors ${
                                                visibility === opt.value
                                                    ? 'bg-bat-yellow/10 text-bat-yellow'
                                                    : 'text-bat-gray hover:bg-bat-gray/10'
                                            }`}
                                        >
                                            <span className={`mt-0.5 ${VISIBILITY_COLORS[opt.value]}`}>{opt.icon}</span>
                                            <div>
                                                <div className="text-sm font-semibold">{opt.label}</div>
                                                <div className="text-xs opacity-60">{opt.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                    <li>• Use ⏱ timer to create a self-deleting post</li>
                    <li>• Choose visibility: Public (all), Followers only, or Close friends</li>
                    <li>• Manage your close friends list in <a href="/settings/close-friends" className="text-bat-blue hover:underline">Settings → Close Friends</a></li>
                </ul>
            </div>
        </div>
    );
}
