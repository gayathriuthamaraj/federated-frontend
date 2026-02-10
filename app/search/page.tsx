"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import UserCard from '../components/UserCard';

export default function SearchPage() {
    const { identity, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !identity) return;

        setSearching(true);
        setHasSearched(true);

        try {
            const res = await fetch(
                `${identity.home_server}/user/search?query=${encodeURIComponent(searchQuery)}`
            );

            if (res.ok) {
                const data = await res.json();
                // Handle both single user and array responses
                if (data.user) {
                    setSearchResults([{
                        userId: data.user.user_id || data.identity?.user_id,
                        username: (data.user.user_id || data.identity?.user_id)?.split('@')[0] || 'unknown',
                        displayName: data.user.display_name || data.profile?.display_name || 'Unknown',
                        avatarUrl: data.user.avatar_url || data.profile?.avatar_url || '',
                        bio: data.user.bio || data.profile?.bio || '',
                    }]);
                } else if (data.users) {
                    setSearchResults(data.users.map(u => ({
                        userId: u.user_id || u.identity?.user_id,
                        username: (u.user_id || u.identity?.user_id)?.split('@')[0] || 'unknown',
                        displayName: u.display_name || u.profile?.display_name || 'Unknown',
                        avatarUrl: u.avatar_url || u.profile?.avatar_url || '',
                        bio: u.bio || u.profile?.bio || '',
                    })));
                } else {
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    if (authLoading) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    if (!identity) {
        router.push('/login');
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-bat-gray mb-2">Search Users</h1>
                <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search for users on your home server..."
                            className="
                                w-full px-4 py-3 pl-12 rounded-lg
                                bg-bat-dark text-white
                                border border-bat-gray/20
                                focus:border-bat-yellow focus:ring-1 focus:ring-bat-yellow
                                outline-none transition-all duration-200
                                placeholder-gray-600
                            "
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bat-gray/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="
                            px-6 py-3 rounded-lg font-bold
                            bg-bat-yellow text-bat-black
                            hover:bg-yellow-400
                            transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>
                <p className="text-sm text-bat-gray/60 mt-2">
                    Search by username or user ID (e.g., "alice" or "alice@localhost:8082")
                </p>
            </div>

            {/* Results */}
            {searching ? (
                <div className="text-center py-12 text-bat-gray">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bat-yellow"></div>
                    <p className="mt-2">Searching...</p>
                </div>
            ) : hasSearched ? (
                searchResults.length === 0 ? (
                    <div className="text-center py-12 text-bat-gray">
                        <svg className="w-16 h-16 mx-auto mb-4 text-bat-gray/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg">No users found</p>
                        <p className="text-sm mt-2">Try searching with a different query</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-bat-gray/60 mb-4">
                            Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-3">
                            {searchResults.map(user => (
                                <UserCard
                                    key={user.userId}
                                    user={user}
                                    showFollowButton={true}
                                    onClick={() => router.push(`/profile?user_id=${encodeURIComponent(user.userId)}`)}
                                />
                            ))}
                        </div>
                    </div>
                )
            ) : (
                <div className="text-center py-12 text-bat-gray/60">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-lg">Search for users on your home server</p>
                    <p className="text-sm mt-2">Enter a username or user ID to get started</p>
                </div>
            )}
        </div>
    );
}
