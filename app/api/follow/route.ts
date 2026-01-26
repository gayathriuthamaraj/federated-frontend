import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.json()

    await fetch('http://localhost:8080/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            follower: 'user01@server01',
            followee: body.target,
        }),
    })

    return NextResponse.json({ ok: true })
}
