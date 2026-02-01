'use client'

import { useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'

export default function SearchPage() {
    const router = useRouter()

    const onSearch = (userId: string) => {
        router.push(`/profile?user_id=${encodeURIComponent(userId)}`)
    }

    return (
        <main className="min-h-screen bg-bat-black p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-bat-yellow mb-2">Search Users</h1>
                    <div className="h-0.5 w-16 bg-bat-yellow rounded-full opacity-50"></div>
                </div>

                <SearchBar onSearch={onSearch} />

                <div className="mt-8 text-center text-bat-gray/60 text-sm">
                    <p>Enter a user ID to view their profile</p>
                    <p className="mt-2">Example: username@server.com</p>
                </div>
            </div>
        </main>
    )
}
