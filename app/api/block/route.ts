import { NextResponse } from 'next/server'

const MODERATION_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

/**
 * POST /api/block
 * Body: { blocker_user_id, blocked_user_id, reason? }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { blocker_user_id, blocked_user_id, reason = '' } = body

        if (!blocker_user_id || !blocked_user_id) {
            return NextResponse.json(
                { error: 'blocker_user_id and blocked_user_id are required' },
                { status: 400 }
            )
        }

        const res = await fetch(`${MODERATION_BASE}/users/block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocker_user_id, blocked_user_id, reason }),
        })

        if (!res.ok) {
            const text = await res.text()
            return NextResponse.json({ error: text }, { status: res.status })
        }

        return NextResponse.json({ status: 'blocked' }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * DELETE /api/block
 * Body: { blocker_user_id, blocked_user_id }
 */
export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const { blocker_user_id, blocked_user_id } = body

        if (!blocker_user_id || !blocked_user_id) {
            return NextResponse.json(
                { error: 'blocker_user_id and blocked_user_id are required' },
                { status: 400 }
            )
        }

        const res = await fetch(`${MODERATION_BASE}/users/unblock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocker_user_id, blocked_user_id }),
        })

        if (!res.ok) {
            const text = await res.text()
            return NextResponse.json({ error: text }, { status: res.status })
        }

        return NextResponse.json({ status: 'unblocked' })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * GET /api/block?blocker_user_id=...&blocked_user_id=...
 * Returns { is_blocked: boolean }
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const blocker_user_id = searchParams.get('blocker_user_id')
        const blocked_user_id = searchParams.get('blocked_user_id')

        if (!blocker_user_id || !blocked_user_id) {
            return NextResponse.json(
                { error: 'blocker_user_id and blocked_user_id query params are required' },
                { status: 400 }
            )
        }

        const res = await fetch(
            `${MODERATION_BASE}/users/block/check?blocker_user_id=${encodeURIComponent(blocker_user_id)}&blocked_user_id=${encodeURIComponent(blocked_user_id)}`
        )

        if (!res.ok) {
            const text = await res.text()
            return NextResponse.json({ error: text }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
