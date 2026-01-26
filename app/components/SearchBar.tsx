'use client'

import { useState } from 'react'

interface SearchBarProps {
    onSearch: (userId: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            onSearch(query.trim())
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 my-4">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter User ID..."
                className="flex-1 p-2 border rounded text-black"
            />
            <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Search
            </button>
        </form>
    )
}
