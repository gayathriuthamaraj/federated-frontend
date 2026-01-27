'use client'

import { useState } from 'react'

export default function FollowButton({
    targetUser,
}: {
    targetUser: string
}) {
    const [status, setStatus] = useState<'idle' | 'done'>('idle')

    const follow = async () => {
        const res = await fetch('/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: targetUser }),
        })

        if (res.ok) setStatus('done')
    }

    return (
        <button
            onClick={follow}
            disabled={status === 'done'}
            className={`
                px-6 py-2 rounded-full font-bold text-sm transition-colors duration-200
                ${status === 'done'
                    ? 'bg-transparent border border-bat-dark text-bat-gray cursor-default opacity-60' // Following state: Subtle, disabled look
                    : 'bg-bat-yellow text-bat-black hover:bg-[#E0B000] cursor-pointer shadow-md' // Follow state: High contrast, heavy, premium
                }
            `}
        >
            {status === 'done' ? 'Following' : 'Follow'}
        </button>
    )
}
