import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function fwd(req: Request): HeadersInit {
    const auth = req.headers.get('authorization');
    return auth ? { Authorization: auth } : {};
}

/** GET /api/following?user_id=...&viewer_id=... */
export async function GET(req: NextRequest) {
    const user_id = req.nextUrl.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    const viewer_id = req.nextUrl.searchParams.get('viewer_id') ?? '';
    const res = await fetch(
        `${BACKEND}/following?user_id=${encodeURIComponent(user_id)}&viewer_id=${encodeURIComponent(viewer_id)}`,
        { headers: fwd(req) },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
