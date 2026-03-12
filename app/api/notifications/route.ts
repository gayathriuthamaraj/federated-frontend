import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function fwd(req: Request): HeadersInit {
    const auth = req.headers.get('authorization');
    return auth ? { Authorization: auth } : {};
}

/** GET /api/notifications?user_id=... */
export async function GET(req: NextRequest) {
    const user_id = req.nextUrl.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    const res = await fetch(
        `${BACKEND}/notifications?user_id=${encodeURIComponent(user_id)}`,
        { headers: fwd(req) },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

/**
 * POST /api/notifications
 * Body: { user_id } — marks all notifications as read.
 */
export async function POST(req: Request) {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...fwd(req) },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
