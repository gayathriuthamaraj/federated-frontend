import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
        return NextResponse.json(
            { error: 'missing user_id' },
            { status: 400 }
        )
    }

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const res = await fetch(
        `${API_BASE}/user/search?user_id=${encodeURIComponent(userId)}`
    )

    if (!res.ok) {
        return NextResponse.json(
            { error: 'profile unavailable' },
            { status: res.status }
        )
    }

    const userDocument = await res.json()

    if (!userDocument.profile) {
        return NextResponse.json(
            { error: 'profile missing' },
            { status: 500 }
        )
    }

    return NextResponse.json({
        profile: userDocument.profile,
    })
}
