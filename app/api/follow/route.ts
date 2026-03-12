import { NextResponse } from 'next/server'

/**
 * POST /api/follow
 * Body: { follower, followee }
 * Thin proxy — the caller (page/component) must supply the authenticated user ID
 * as `follower`. Most pages call `identity.home_server/follow` directly instead.
 */
export async function POST(req: Request) {
    const body = await req.json()
    const { follower, followee } = body

    if (!follower || !followee) {
        return NextResponse.json({ error: 'follower and followee are required' }, { status: 400 })
    }

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const res = await fetch(`${API_BASE}/follow`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: req.headers.get('authorization') || '',
        },
        body: JSON.stringify({ follower, followee }),
    })

    if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: text }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
}
