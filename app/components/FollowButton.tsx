'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface FollowButtonProps {
    targetUser: string
    isFollowing?: boolean 
    onSuccess?: () => void
}

export default function FollowButton({
    targetUser,
    isFollowing = false,
    onSuccess
}: FollowButtonProps) {
    const { identity } = useAuth()
    const [status, setStatus] = useState<'idle' | 'followed' | 'loading'>('idle')
    const [actionError, setActionError] = useState<string | null>(null)

    // Auto-clear error after 4 seconds
    useEffect(() => {
        if (!actionError) return
        const t = setTimeout(() => setActionError(null), 4000)
        return () => clearTimeout(t)
    }, [actionError])

    useEffect(() => {
        if (isFollowing) {
            setStatus('followed')
        }
    }, [isFollowing])

    const handleAction = async () => {
        if (!identity) return
        if (identity.user_id === targetUser) return

        setStatus('loading')
        setActionError(null)

        try {
            const endpoint = status === 'followed' ? '/unfollow' : '/follow'
            const body = {
                follower: identity.user_id,
                followee: targetUser
            }

            const res = await fetch(`${identity.home_server}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                const newStatus = status === 'followed' ? 'idle' : 'followed'
                setStatus(newStatus)
                if (onSuccess) onSuccess()
            } else {
                setActionError('Action failed. Please try again.')
                setStatus(status)
            }
        } catch {
            setActionError('Something went wrong. Please try again.')
            setStatus(status)
        }
    }

    if (!identity) return null
    if (identity.user_id === targetUser) return null

    return (
        <>
            <button
                onClick={handleAction}
                disabled={status === 'loading'}
                className={`
                    px-6 py-2 rounded-full font-bold text-sm transition-all duration-200
                    ${status === 'followed'
                        ? 'bg-transparent border border-bat-dark text-bat-gray hover:text-red-500 hover:border-red-500' 
                        : 'bg-bat-yellow text-bat-black hover:bg-[#E0B000] shadow-md' 
                    }
                    ${status === 'loading' ? 'opacity-50 cursor-wait' : ''}
                `}
            >
                {status === 'loading'
                    ? 'Processing...'
                    : status === 'followed'
                        ? 'Unfollow'
                        : 'Follow'
                }
            </button>
            {actionError && <p className="text-xs text-red-400 mt-1">{actionError}</p>}
        </>
    )
}
