import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    const res = await fetch(
        `http://localhost:8080/user/search?user_id=${userId}`
    )

    if (!res.ok) {
        return NextResponse.json({}, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
}
