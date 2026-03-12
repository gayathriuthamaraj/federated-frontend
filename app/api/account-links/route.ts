import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

async function safeJson(res: Response) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: text || `HTTP ${res.status}` }; }
}

export async function GET(req: NextRequest) {
    const userID = req.nextUrl.searchParams.get('user_id');
    if (!userID) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const res = await fetch(`${BACKEND}/account/links?user_id=${encodeURIComponent(userID)}`);
    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/account/link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
}
