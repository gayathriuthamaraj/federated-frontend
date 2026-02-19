"use client";

import { useState } from 'react';
import { mockUsers, mockPosts } from '../../data/mockData';
import UserCard from '../../components/UserCard';
import PostCard from '../../components/PostCard';

export default function ExplorePage() {
    const [activeTab, setActiveTab] = useState<'trending' | 'users'>('trending');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = mockUsers.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className=" max-w-3xl mx-auto p-6">
                {}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-bat-gray mb-2">Explore</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                </div>

                {}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Gotham Social..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="
                w-full px-4 py-3 pl-12 rounded-lg
                bg-bat-dark text-white
                border border-bat-gray/20
                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                outline-none transition-all duration-200
                placeholder-gray-600
              "
                        />
                        <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {}
                <div className="flex gap-4 mb-6 border-b border-bat-gray/10">
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={`
              px-4 py-2 font-bold transition-all duration-200
              ${activeTab === 'trending'
                                ? 'text-bat-yellow border-b-2 border-bat-yellow'
                                : 'text-gray-500 hover:text-bat-gray'
                            }
            `}
                    >
                        Trending
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
              px-4 py-2 font-bold transition-all duration-200
              ${activeTab === 'users'
                                ? 'text-bat-yellow border-b-2 border-bat-yellow'
                                : 'text-gray-500 hover:text-bat-gray'
                            }
            `}
                    >
                        Users
                    </button>
                </div>

                {}
                {activeTab === 'trending' ? (
                    <div className="space-y-4">
                        {mockPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map(user => (
                            <UserCard key={user.id} user={user} showFollowButton={true} />
                        ))}
                    </div>
                )}
            </div>
    );
}