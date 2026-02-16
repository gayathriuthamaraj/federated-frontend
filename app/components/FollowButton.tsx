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

    useEffect(() => {
        if (isFollowing) {
            setStatus('followed')
        }
    }, [isFollowing])

    const handleAction = async () => {
        if (!identity) {
            alert('Please log in to follow users')
            return
        }

        if (identity.user_id === targetUser) {
            alert("You can't follow yourself!")
            return
        }

        setStatus('loading')

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
                const error = await res.text()
                alert(`Action failed: ${error}`)
                setStatus(status) 
            }
        } catch (err: any) {
            console.error('Follow error:', err)
            alert(`Failed: ${err.message || err}`)
            setStatus(status)
        }
    }

    if (!identity) return null
    if (identity.user_id === targetUser) return null

    return (
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
    )
}
