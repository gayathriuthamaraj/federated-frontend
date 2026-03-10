import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function fwd(req: Request): HeadersInit {
    const auth = req.headers.get('authorization');
    return auth ? { Authorization: auth } : {};
}

/**
 * GET /api/messages?user_id=...                — list conversations
 * GET /api/messages?user_id=...&other_user_id=... — messages in a conversation
 */
export async function GET(req: NextRequest) {
    const user_id = req.nextUrl.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    const other_user_id = req.nextUrl.searchParams.get('other_user_id');
    const limit = req.nextUrl.searchParams.get('limit') ?? '50';

    let backendUrl: string;
    if (other_user_id) {
        backendUrl = `${BACKEND}/conversation/messages?user_id=${encodeURIComponent(user_id)}&other_user_id=${encodeURIComponent(other_user_id)}&limit=${limit}`;
    } else {
        backendUrl = `${BACKEND}/conversations?user_id=${encodeURIComponent(user_id)}&limit=${limit}`;
    }

    const res = await fetch(backendUrl, { headers: fwd(req) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

/**
 * POST /api/messages
 * Body: { sender_id, receiver_id, content, image_url? } — send a message.
 */
export async function POST(req: Request) {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...fwd(req) },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
