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
                mt-4 w-full h-9 rounded-md
                text-sm tracking-wide
                transition-all duration-200
                border

                ${status === 'done'
                    ? `
                            cursor-default
                            text-bat-gray
                            border-bat-gray/30
                            bg-bat-dark
                        `
                    : `
                            cursor-pointer
                            text-bat-blue
                            border-bat-blue/30
                            bg-transparent
                            hover:text-white
                            hover:bg-bat-blue/10
                            shadow-[0_0_10px_rgba(47,128,237,0.15)]
                        `
                }
            `}
        >
            {status === 'done' ? 'Following' : 'Follow'}
        </button>
    )
}
