import { NextResponse } from 'next/server';
import { mockUsers } from '@/app/data/mockData';

// In-memory storage for following
const following = new Map<string, Set<string>>();

// Initialize with some mock data
following.set('batman', new Set(['robin', 'alfred', 'batgirl', 'gordon']));
following.set('robin', new Set(['batman', 'batgirl']));
following.set('harley', new Set(['joker']));

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userFollowing = following.get(userId) || new Set();
    const followingUsers = mockUsers.filter(u => userFollowing.has(u.username));

    return NextResponse.json(followingUsers);
}

export async function POST(request: Request) {
    const { userId, targetUserId } = await request.json();

    if (!following.has(userId)) {
        following.set(userId, new Set());
    }

    const userFollowing = following.get(userId)!;
    const wasFollowing = userFollowing.has(targetUserId);

    if (wasFollowing) {
        userFollowing.delete(targetUserId);
    } else {
        userFollowing.add(targetUserId);
    }

    return NextResponse.json({
        following: !wasFollowing,
        followingCount: userFollowing.size
    });
}
