'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface BlockButtonProps {
    targetUser: string
    /** Initial blocked state; fetched automatically if not provided */
    isBlocked?: boolean
    /** Callback fired after a successful block/unblock */
    onSuccess?: (blocked: boolean) => void
    /** 'button' renders a styled button; 'menuitem' renders a plain text action */
    variant?: 'button' | 'menuitem'
}

export default function BlockButton({
    targetUser,
    isBlocked: isBlockedProp,
    onSuccess,
    variant = 'button',
}: BlockButtonProps) {
    const { identity } = useAuth()
    const [blocked, setBlocked] = useState(isBlockedProp ?? false)
    const [loading, setLoading] = useState(false)
    const [confirming, setConfirming] = useState(false)

    // Auto-fetch blocked state when prop not supplied
    useEffect(() => {
        if (!identity || !targetUser || isBlockedProp !== undefined) return
        fetch(
            `${identity.home_server}/blocks?user_id=${encodeURIComponent(identity.user_id)}`
        )
            .then(r => r.json())
            .then((list: Array<{ blocked_id: string }> | null) => {
                if (Array.isArray(list)) {
                    setBlocked(list.some(b => b.blocked_id === targetUser))
                }
            })
            .catch(() => {})
    }, [identity, targetUser, isBlockedProp])

    // Keep in sync when prop changes externally
    useEffect(() => {
        if (isBlockedProp !== undefined) setBlocked(isBlockedProp)
    }, [isBlockedProp])

    if (!identity) return null
    if (identity.user_id === targetUser) return null

    const handleClick = async () => {
        // Require confirmation before blocking
        if (!blocked && !confirming) {
            setConfirming(true)
            return
        }
        setConfirming(false)
        setLoading(true)

        try {
            const endpoint = blocked ? '/unblock' : '/block'
            const res = await fetch(`${identity.home_server}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blocker_id: identity.user_id,
                    blocked_id: targetUser,
                }),
            })

            if (res.ok) {
                const next = !blocked
                setBlocked(next)
                onSuccess?.(next)
            } else {
                const err = await res.text()
                alert(`Action failed: ${err}`)
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelConfirm = () => setConfirming(false)

    if (variant === 'menuitem') {
        return (
            <div>
                {confirming ? (
                    <div className="flex items-center gap-2 px-4 py-2">
                        <span className="text-sm text-red-400">Block @{targetUser.split('@')[0]}?</span>
                        <button
                            onClick={handleClick}
                            disabled={loading}
                            className="text-xs font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                            {loading ? 'Blocking…' : 'Confirm'}
                        </button>
                        <button
                            onClick={handleCancelConfirm}
                            className="text-xs text-bat-gray/50 hover:text-bat-gray"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleClick}
                        disabled={loading}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-50
                            ${blocked
                                ? 'text-bat-gray/70 hover:text-bat-gray hover:bg-white/5'
                                : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            }`}
                    >
                        {loading ? '…' : blocked ? `Unblock @${targetUser.split('@')[0]}` : `Block @${targetUser.split('@')[0]}`}
                    </button>
                )}
            </div>
        )
    }

    // Default: 'button' variant
    return (
        <div className="flex items-center gap-2">
            {confirming && (
                <>
                    <span className="text-xs text-red-400">Block {targetUser.split('@')[0]}?</span>
                    <button
                        onClick={handleClick}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
                    >
                        {loading ? '…' : 'Confirm'}
                    </button>
                    <button
                        onClick={handleCancelConfirm}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border border-bat-gray/30 text-bat-gray/60 hover:border-bat-gray hover:text-bat-gray transition-colors"
                    >
                        Cancel
                    </button>
                </>
            )}
            {!confirming && (
                <button
                    onClick={handleClick}
                    disabled={loading}
                    className={`
                        px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 disabled:opacity-50
                        ${blocked
                            ? 'bg-transparent border border-bat-dark text-bat-gray hover:border-green-500 hover:text-green-400'
                            : 'bg-transparent border border-bat-gray/30 text-bat-gray/60 hover:border-red-500 hover:text-red-400'
                        }
                    `}
                >
                    {loading ? '…' : blocked ? 'Unblock' : 'Block'}
                </button>
            )}
        </div>
    )
}
