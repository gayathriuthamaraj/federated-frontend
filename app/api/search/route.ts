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

    const res = await fetch(
        `http://localhost:8080/user/search?user_id=${encodeURIComponent(userId)}`
    )

    if (!res.ok) {
        return NextResponse.json(
            { error: 'profile unavailable' },
            { status: res.status }
        )
    }

    const userDocument = await res.json()

    // 🛑 Hard safety check
    if (!userDocument.profile) {
        return NextResponse.json(
            { error: 'profile missing' },
            { status: 500 }
        )
    }

    /**
     * IMPORTANT:
     * Identity is intentionally NOT exposed to UI components.
     * It will be used later for encryption / verification only.
     */
    return NextResponse.json({
        profile: userDocument.profile,
    })
}

