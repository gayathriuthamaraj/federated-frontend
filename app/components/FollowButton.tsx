'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function FollowButton({
    targetUser,
    onSuccess
}: {
    targetUser: string
    onSuccess?: () => void
}) {
    const { identity } = useAuth()
    const [status, setStatus] = useState<'idle' | 'done'>('idle')
    const [isLoading, setIsLoading] = useState(false)

    const follow = async () => {
        if (!identity) {
            alert('Please log in to follow users')
            return
        }

        if (identity.user_id === targetUser) {
            alert("You can't follow yourself!")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('http://localhost:8082/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    follower: identity.user_id,
                    followee: targetUser
                }),
            })

            if (res.ok) {
                setStatus('done')
                if (onSuccess) onSuccess()
            } else {
                const error = await res.text()
                alert(`Failed to follow: ${error}`)
            }
        } catch (err: any) {
            console.error('Follow error:', err)
            alert(`Failed to follow user: ${err.message || err}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (!identity) {
        return null // Don't show button if not logged in
    }

    if (identity.user_id === targetUser) {
        return null // Don't show follow button on own profile
    }

    return (
        <button
            onClick={follow}
            disabled={status === 'done' || isLoading}
            className={`
                px-6 py-2 rounded-full font-bold text-sm transition-colors duration-200
                ${status === 'done'
                    ? 'bg-transparent border border-bat-dark text-bat-gray cursor-default opacity-60' // Following state: Subtle, disabled look
                    : 'bg-bat-yellow text-bat-black hover:bg-[#E0B000] cursor-pointer shadow-md' // Follow state: High contrast, heavy, premium
                }
                ${isLoading ? 'opacity-50 cursor-wait' : ''}
            `}
        >
            {isLoading ? 'Following...' : status === 'done' ? 'Following' : 'Follow'}
        </button>
    )
}
