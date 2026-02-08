import { NextResponse } from 'next/server';
import { mockPosts } from '@/app/data/mockData';

export async function GET() {
    return NextResponse.json(mockPosts);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newPost = {
        id: String(Date.now()),
        ...body,
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        isLiked: false,
        timestamp: 'Just now'
    };

    return NextResponse.json(newPost);
}
