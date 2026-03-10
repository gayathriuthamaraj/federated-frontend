import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function fwd(req: Request): HeadersInit {
    const auth = req.headers.get('authorization');
    return auth ? { Authorization: auth } : {};
}

/**
 * GET /api/users?user_id=... — fetch a specific user's public profile.
 * GET /api/users?suggested=true&user_id=... — suggested users to follow.
 */
export async function GET(req: NextRequest) {
    const user_id = req.nextUrl.searchParams.get('user_id');
    const suggested = req.nextUrl.searchParams.get('suggested');

    if (suggested === 'true' && user_id) {
        const res = await fetch(
            `${BACKEND}/users/suggested?user_id=${encodeURIComponent(user_id)}`,
            { headers: fwd(req) },
        );
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    }

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    const res = await fetch(
        `${BACKEND}/user/search?user_id=${encodeURIComponent(user_id)}`,
        { headers: fwd(req) },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
