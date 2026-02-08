"use client";

import { useState } from 'react';
import { mockUsers } from '../../data/mockData';

export default function FollowersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [followers, setFollowers] = useState(mockUsers);
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    // Filter users based on search
    const filteredFollowers = followers.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRemoveFollower = (userId: string) => {
        setFollowers(followers.filter(u => u.id !== userId));
        setConfirmRemove(null);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-bat-dark sticky top-0 bg-bat-black/95 backdrop-blur-sm z-10">
                <h1 className="text-xl font-bold text-bat-gray">Followers</h1>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-bat-dark">
                <input
                    type="text"
                    placeholder="Search followers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="
                        w-full px-4 py-2 rounded-full
                        bg-bat-dark text-white
                        border border-bat-gray/20
                        focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                        outline-none transition-all duration-200
                        placeholder-gray-600
                    "
                />
            </div>

            {/* Followers List */}
            <div>
                {filteredFollowers.length > 0 ? (
                    filteredFollowers.map(user => (
                        <article
                            key={user.id}
                            className="flex gap-3 px-4 py-3 border-b border-bat-dark hover:bg-bat-dark/20 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="h-12 w-12 rounded-full"
                                />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 text-[15px] leading-5">
                                    <span className="font-bold text-gray-200 truncate">
                                        {user.displayName}
                                    </span>
                                    <span className="text-bat-gray/60 truncate">
                                        @{user.username}
                                    </span>
                                </div>
                                {user.bio && (
                                    <div className="mt-1 text-[15px] text-bat-gray leading-normal line-clamp-2">
                                        {user.bio}
                                    </div>
                                )}
                            </div>

                            {/* Remove Button */}
                            <div className="flex-shrink-0 flex items-start pt-1">
                                <button
                                    onClick={() => setConfirmRemove(user.id)}
                                    className="
                                        px-4 py-1.5 rounded-full font-bold text-sm
                                        bg-bat-black text-bat-gray
                                        border border-bat-gray/30
                                        hover:bg-red-500/10 hover:border-red-500 hover:text-red-500
                                        transition-all duration-200
                                    "
                                >
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No followers found</p>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            {confirmRemove && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bat-dark rounded-2xl p-6 max-w-sm w-full border border-bat-gray/20">
                        <h2 className="text-xl font-bold text-bat-gray mb-2">Remove follower?</h2>
                        <p className="text-bat-gray/60 mb-6">
                            {followers.find(u => u.id === confirmRemove)?.displayName} will no longer be able to follow you. They won't be notified.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmRemove(null)}
                                className="
                                    flex-1 px-4 py-2 rounded-full font-bold
                                    bg-bat-black text-bat-gray
                                    border border-bat-gray/30
                                    hover:bg-bat-gray/10
                                    transition-all duration-200
                                "
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRemoveFollower(confirmRemove)}
                                className="
                                    flex-1 px-4 py-2 rounded-full font-bold
                                    bg-red-500 text-white
                                    hover:bg-red-600
                                    transition-all duration-200
                                "
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}