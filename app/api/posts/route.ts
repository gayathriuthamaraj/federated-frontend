import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function fwd(req: Request): HeadersInit {
    const auth = req.headers.get('authorization');
    return auth ? { Authorization: auth } : {};
}

/**
 * GET /api/posts?user_id=...&limit=...&offset=... — recent posts for user's feed.
 */
export async function GET(req: NextRequest) {
    const user_id = req.nextUrl.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    const limit = req.nextUrl.searchParams.get('limit') ?? '20';
    const offset = req.nextUrl.searchParams.get('offset') ?? '0';
    const res = await fetch(
        `${BACKEND}/feed?user_id=${encodeURIComponent(user_id)}&limit=${limit}&offset=${offset}`,
        { headers: fwd(req) },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

/**
 * POST /api/posts
 * Body: { author, content, image_url?, visibility?, content_warning?, expires_at? }
 */
export async function POST(req: Request) {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/post/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...fwd(req) },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
