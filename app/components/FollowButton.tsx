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
            className="mt-3 bg-blue-600 text-white px-4 py-1"
            onClick={follow}
            disabled={status === 'done'}
        >
            {status === 'done' ? 'Following' : 'Follow'}
        </button>
    )
}
