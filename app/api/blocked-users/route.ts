import { NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

/**
 * GET /api/blocked-users?user_id=...
 * Returns array of BlockEvent ({ blocker_id, blocked_id, reason, created_at })
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const user_id = searchParams.get('user_id')

        if (!user_id) {
            return NextResponse.json(
                { error: 'user_id query param is required' },
                { status: 400 }
            )
        }

        const res = await fetch(
            `${BACKEND}/blocks?user_id=${encodeURIComponent(user_id)}`,
            { headers: { Authorization: req.headers.get('authorization') || '' } }
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
