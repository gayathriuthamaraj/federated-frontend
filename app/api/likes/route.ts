import { NextResponse } from 'next/server';

// In-memory storage for likes
const likes = new Map<string, Set<string>>();

export async function POST(request: Request) {
    const { postId, userId } = await request.json();

    if (!likes.has(postId)) {
        likes.set(postId, new Set());
    }

    const postLikes = likes.get(postId)!;
    const wasLiked = postLikes.has(userId);

    if (wasLiked) {
        postLikes.delete(userId);
    } else {
        postLikes.add(userId);
    }

    return NextResponse.json({
        liked: !wasLiked,
        likeCount: postLikes.size
    });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
        return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const postLikes = likes.get(postId) || new Set();

    return NextResponse.json({
        likeCount: postLikes.size,
        likedBy: Array.from(postLikes)
    });
}
