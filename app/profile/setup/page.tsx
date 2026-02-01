"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/profile';

export default function ProfileSetupPage() {
    const { identity } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        displayName: identity?.user_id || '',
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
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identity) {
            setError('Not authenticated');
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

    const handleSkip = () => {
        router.push('/profile');
    };

    return (
        <div className="min-h-screen bg-bat-black p-4 py-8">
            <div className="max-w-2xl mx-auto bg-bat-dark rounded-lg shadow-2xl border border-bat-gray/10">
                {/* Header */}
                <div className="p-8 border-b border-bat-gray/10">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Complete Your Profile</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50 mb-3"></div>
                    <p className="text-sm text-gray-500">
                        Add your details to personalize your Gotham Social experience
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Display Name */}
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

                    {/* Avatar URL */}
                    <div>
                        <label htmlFor="avatarUrl" className="block text-sm font-medium text-bat-gray mb-2">
                            Avatar URL
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

                    {/* Banner URL */}
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

                    {/* Bio */}
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

                    {/* Portfolio URL */}
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

                    {/* Birth Date */}
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

                    {/* Location */}
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

                    {/* Privacy Settings */}
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

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="
                                w-full py-3 px-4 rounded-md font-bold text-lg
                                bg-bat-yellow text-bat-black
                                hover:bg-yellow-400
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transform active:scale-[0.98]
                                transition-all duration-200
                                shadow-[0_0_15px_rgba(245,197,24,0.3)]
                            "
                        >
                            {isSubmitting ? 'Saving...' : 'Complete Profile'}
                        </button>

                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            className="
                                w-full py-2 text-sm
                                text-gray-600
                                hover:text-bat-gray
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200
                            "
                        >
                            I'll do this later
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
