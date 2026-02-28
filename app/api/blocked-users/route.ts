import { NextResponse } from 'next/server'

const MODERATION_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

/**
 * GET /api/blocked-users?blocker_user_id=...
 * Returns { blocked_users: UserBlock[] }
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const blocker_user_id = searchParams.get('blocker_user_id')

        if (!blocker_user_id) {
            return NextResponse.json(
                { error: 'blocker_user_id query param is required' },
                { status: 400 }
            )
        }

        const res = await fetch(
            `${MODERATION_BASE}/users/blocked?blocker_user_id=${encodeURIComponent(blocker_user_id)}`
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
