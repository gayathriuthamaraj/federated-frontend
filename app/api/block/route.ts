import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

function getToken(req: Request): string {
    return req.headers.get('authorization') || ''
}

/**
 * POST /api/block
 * Body: { blocker_id, blocked_id, reason? }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { blocker_id, blocked_id, reason = '' } = body

        if (!blocker_id || !blocked_id) {
            return NextResponse.json(
                { error: 'blocker_id and blocked_id are required' },
                { status: 400 }
            )
        }

        const res = await fetch(`${BACKEND}/block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: getToken(req) },
            body: JSON.stringify({ blocker_id, blocked_id, reason }),
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
 * Body: { blocker_id, blocked_id }
 */
export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const { blocker_id, blocked_id } = body

        if (!blocker_id || !blocked_id) {
            return NextResponse.json(
                { error: 'blocker_id and blocked_id are required' },
                { status: 400 }
            )
        }

        const res = await fetch(`${BACKEND}/unblock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: getToken(req) },
            body: JSON.stringify({ blocker_id, blocked_id }),
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
 * GET /api/block?user_id=...
 * Returns the block list for the given user (array of BlockEvent)
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
            { headers: { Authorization: getToken(req) } }
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
