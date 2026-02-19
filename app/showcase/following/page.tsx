"use client";

import { useState } from 'react';
import { mockUsers } from '../../data/mockData';

export default function FollowingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [following, setFollowing] = useState(mockUsers.filter(u => u.isFollowing));
    const [confirmUnfollow, setConfirmUnfollow] = useState<string | null>(null);

    const filteredFollowing = following.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUnfollow = (userId: string) => {
        setFollowing(following.filter(u => u.id !== userId));
        setConfirmUnfollow(null);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {}
            <div className="px-4 py-3 border-b border-bat-dark sticky top-0 bg-bat-black/95 backdrop-blur-sm z-10">
                <h1 className="text-xl font-bold text-bat-gray">Following</h1>
            </div>

            {}
            <div className="px-4 py-3 border-b border-bat-dark">
                <input
                    type="text"
                    placeholder="Search following..."
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

            {}
            <div>
                {filteredFollowing.length > 0 ? (
                    filteredFollowing.map(user => (
                        <article
                            key={user.id}
                            className="flex gap-3 px-4 py-3 border-b border-bat-dark hover:bg-bat-dark/20 transition-colors"
                        >
                            {}
                            <div className="flex-shrink-0">
                                <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="h-12 w-12 rounded-full"
                                />
                            </div>

                            {}
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

                            {}
                            <div className="flex-shrink-0 flex items-start pt-1">
                                <button
                                    onClick={() => setConfirmUnfollow(user.id)}
                                    className="
                                        px-4 py-1.5 rounded-full font-bold text-sm
                                        bg-bat-black text-bat-gray
                                        border border-bat-gray/30
                                        hover:bg-red-500/10 hover:border-red-500 hover:text-red-500
                                        transition-all duration-200
                                        group
                                    "
                                >
                                    <span className="group-hover:hidden">Following</span>
                                    <span className="hidden group-hover:inline">Unfollow</span>
                                </button>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {searchQuery ? 'No users found' : 'You are not following anyone yet'}
                        </p>
                    </div>
                )}
            </div>

            {}
            {confirmUnfollow && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bat-dark rounded-2xl p-6 max-w-sm w-full border border-bat-gray/20">
                        <h2 className="text-xl font-bold text-bat-gray mb-2">Unfollow @{following.find(u => u.id === confirmUnfollow)?.username}?</h2>
                        <p className="text-bat-gray/60 mb-6">
                            Their posts will no longer show up in your home timeline. You can still view their profile.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmUnfollow(null)}
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
                                onClick={() => handleUnfollow(confirmUnfollow)}
                                className="
                                    flex-1 px-4 py-2 rounded-full font-bold
                                    bg-bat-gray text-bat-black
                                    hover:bg-bat-gray/80
                                    transition-all duration-200
                                "
                            >
                                Unfollow
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}