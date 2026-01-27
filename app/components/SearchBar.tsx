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
        <form
            onSubmit={handleSubmit}
            className="
                group
                flex items-center gap-3
                w-full max-w-[600px]
                bg-bat-dark
                border border-transparent
                rounded-full
                px-5 py-2.5
                transition-all duration-200
                focus-within:bg-black
                focus-within:border-bat-yellow/50
                focus-within:ring-1 focus-within:ring-bat-yellow/50
            "
        >
            {/* Search icon */}
            <span className="text-bat-gray/50 group-focus-within:text-bat-yellow transition-colors">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                    <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904l5.625 5.625 1.06-1.06-5.625-5.625c1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-5 6.5c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z"></path>
                </svg>
            </span>

            {/* Input */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user_id@server"
                className="
                    flex-1 bg-transparent
                    text-bat-gray
                    placeholder-bat-gray/50
                    text-[15px]
                    outline-none
                "
            />

            {/* Hidden submit for Enter key, or keep visible if preferred. Twitter hides it mostly, but let's keep it minimal if needed. 
                Actually, Twitter doesn't show a 'Search' button in the pill. It's cleaner without.
                But for usability, maybe a hidden button or just reliance on Enter.
                I will remove the button to match 'Minimal clutter' rule, unless user insists.
                Wait, 'Clear hierarchy'. The search bar usually has no button on Twitter desktop top bar.
            */}
        </form>
    )
}
