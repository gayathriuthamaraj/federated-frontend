"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, getUserProfile } from '../../api/profile';

export default function EditProfilePage() {
    const { identity } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        displayName: '',
        avatarUrl: '',
        bannerUrl: '',
        bio: '',
        portfolioUrl: '',
        birthDate: '',
        location: '',
        followersVisibility: 'public' as 'public' | 'private',
        followingVisibility: 'public' as 'public' | 'private',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    
    useEffect(() => {
        const loadProfile = async () => {
            if (!identity?.user_id) return;

            try {
                const data = await getUserProfile(identity.user_id);
                const profile = data.profile;

                setFormData({
                    displayName: profile.display_name || '',
                    avatarUrl: profile.avatar_url || '',
                    bannerUrl: profile.banner_url || '',
                    bio: profile.bio || '',
                    portfolioUrl: profile.portfolio_url || '',
                    birthDate: profile.birth_date ? profile.birth_date.split('T')[0] : '',
                    location: profile.location || '',
                    followersVisibility: profile.followers_visibility || 'public',
                    followingVisibility: profile.following_visibility || 'public',
                });
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [identity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identity) {
            setError('Not authenticated');
            return;
        }

        if (!formData.displayName) {
            setError('Display name is required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await updateProfile({
                user_id: identity.user_id,
                display_name: formData.displayName || undefined,
                avatar_url: formData.avatarUrl || undefined,
                banner_url: formData.bannerUrl || undefined,
                bio: formData.bio || undefined,
                portfolio_url: formData.portfolioUrl || undefined,
                birth_date: formData.birthDate || undefined,
                location: formData.location || undefined,
                followers_visibility: formData.followersVisibility,
                following_visibility: formData.followingVisibility,
            });

            router.push('/profile');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/profile');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bat-black flex items-center justify-center">
                <div className="text-bat-gray">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bat-black p-4 py-8">
            <div className="max-w-2xl mx-auto bg-bat-dark rounded-lg shadow-2xl border border-bat-gray/10">
                {}
                <div className="p-8 border-b border-bat-gray/10">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Edit Profile</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50 mb-3"></div>
                    <p className="text-sm text-gray-500">
                        Update your profile information
                    </p>
                </div>

                {}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {}
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-bat-gray mb-2">
                            Display Name <span className="text-bat-yellow">*</span>
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            placeholder="How should we call you?"
                            required
                        />
                    </div>

                    {}
                    <div>
                        <label htmlFor="avatarUrl" className="block text-sm font-medium text-bat-gray mb-2">
                            Profile Picture URL
                        </label>
                        <input
                            type="url"
                            id="avatarUrl"
                            value={formData.avatarUrl}
                            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            placeholder="https://example.com/avatar.jpg"
                        />
                        {formData.avatarUrl && (
                            <div className="mt-3 flex items-center space-x-3">
                                <img
                                    src={formData.avatarUrl}
                                    alt="Avatar preview"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-bat-yellow/50"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=?';
                                    }}
                                />
                                <span className="text-xs text-gray-500">Preview</span>
                            </div>
                        )}
                    </div>

                    {}
                    <div>
                        <label htmlFor="bannerUrl" className="block text-sm font-medium text-bat-gray mb-2">
                            Banner URL
                        </label>
                        <input
                            type="url"
                            id="bannerUrl"
                            value={formData.bannerUrl}
                            onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            placeholder="https://example.com/banner.jpg"
                        />
                        {formData.bannerUrl && (
                            <div className="mt-3">
                                <img
                                    src={formData.bannerUrl}
                                    alt="Banner preview"
                                    className="w-full h-32 rounded-md object-cover border border-bat-yellow/50"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x200?text=Banner';
                                    }}
                                />
                                <span className="text-xs text-gray-500 mt-1 block">Preview</span>
                            </div>
                        )}
                    </div>

                    {}
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-bat-gray mb-2">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                                resize-none
                            "
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    {}
                    <div>
                        <label htmlFor="portfolioUrl" className="block text-sm font-medium text-bat-gray mb-2">
                            Portfolio / Website
                        </label>
                        <input
                            type="url"
                            id="portfolioUrl"
                            value={formData.portfolioUrl}
                            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    {}
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-bat-gray mb-2">
                            Birth Date
                        </label>
                        <input
                            type="date"
                            id="birthDate"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                            "
                        />
                    </div>

                    {}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-bat-gray mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="
                                w-full px-4 py-3 rounded-md
                                bg-bat-black text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            placeholder="Gotham City"
                        />
                    </div>

                    {}
                    <div className="space-y-4 pt-4 border-t border-bat-gray/10">
                        <h3 className="text-lg font-semibold text-bat-gray">Privacy Settings</h3>

                        <div className="flex items-center justify-between p-4 bg-bat-black rounded-md border border-bat-gray/10">
                            <div>
                                <label htmlFor="followersVisibility" className="block text-sm font-medium text-bat-gray">
                                    Followers Visibility
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Who can see your followers list</p>
                            </div>
                            <select
                                id="followersVisibility"
                                value={formData.followersVisibility}
                                onChange={(e) => setFormData({ ...formData, followersVisibility: e.target.value as 'public' | 'private' })}
                                className="
                                    px-4 py-2 rounded-md
                                    bg-bat-dark text-white
                                    border border-bat-gray/20
                                    focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                    outline-none transition-all duration-200
                                "
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-bat-black rounded-md border border-bat-gray/10">
                            <div>
                                <label htmlFor="followingVisibility" className="block text-sm font-medium text-bat-gray">
                                    Following Visibility
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Who can see who you follow</p>
                            </div>
                            <select
                                id="followingVisibility"
                                value={formData.followingVisibility}
                                onChange={(e) => setFormData({ ...formData, followingVisibility: e.target.value as 'public' | 'private' })}
                                className="
                                    px-4 py-2 rounded-md
                                    bg-bat-dark text-white
                                    border border-bat-gray/20
                                    focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                    outline-none transition-all duration-200
                                "
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>

                    {}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
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
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
                </form>
            </div>
        </div>
    );
}
