'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import ProfileCard from '@/components/ProfileCard'
import { Profile } from '@/types/profile'

export default function SearchPage() {
    const [searchedProfile, setSearchedProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const onSearch = async (userId: string) => {
        // Construct federated ID for search if needed
        // Assuming user inputs just "username", default to localhost if no @
        // But backend expects full ID possibly?
        // Let's keep it robust: input as is, or handle @ logic.
        // For now, pass input directly, but maybe append @localhost if missing?
        // The backend UserSearchHandler expects 'user_id' param.

        const queryId = userId.includes('@') ? userId : `${userId}@localhost`

        setLoading(true)
        setError('')
        setSearchedProfile(null)

        try {
            // Use Federation Server for Lookup
            const res = await fetch(`http://localhost:8081/federation/lookup?id=${encodeURIComponent(queryId)}`)

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('User not found')
                }
                throw new Error('Failed to find user')
            }

            const json = await res.json()
            // Response format: { success: true, data: { identity: ..., profile: ... } }

            if (json.success && json.data && json.data.profile) {
                setSearchedProfile(json.data.profile)
            } else {
                throw new Error('Invalid response format')
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-bat-black p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-bat-yellow mb-2">Search Users</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                </div>

                <div className="flex justify-center mb-10">
                    <SearchBar onSearch={onSearch} />
                </div>

                {/* Status / Error Messages */}
                {loading && (
                    <div className="text-center text-bat-gray py-8">
                        Searching...
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-400 py-8 bg-bat-dark/30 rounded-lg border border-red-500/20 max-w-lg mx-auto">
                        <p className="font-semibold">{error}</p>
                        <p className="text-sm opacity-70 mt-1">Try checking the username or server</p>
                    </div>
                )}

                {/* Search Results */}
                {searchedProfile && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* We pass a limited version of props since we might not have all posts loaded immediately */}
                        <div className="border border-bat-dark rounded-xl overflow-hidden shadow-2xl">
                            <ProfileCard
                                profile={searchedProfile}
                                isOwnProfile={false} // Search context implies viewing others
                                loadingPosts={false} // Could potentially load posts too if we wanted
                            />
                        </div>
                    </div>
                )}

                {!searchedProfile && !loading && !error && (
                    <div className="text-center text-bat-gray/60 text-sm mt-8">
                        <p>Enter a user ID to view their profile</p>
                        <p className="mt-2 text-xs opacity-50">Example: username@server.com</p>
                    </div>
                )}
            </div>
        </main>
    )
}
