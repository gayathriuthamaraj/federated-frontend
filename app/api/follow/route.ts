import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.json()

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8082';
    await fetch(`${API_BASE}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            follower: 'user01@server01',
            followee: body.target,
        }),
    })

    return NextResponse.json({ ok: true })
}
