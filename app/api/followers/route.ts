import { NextResponse } from 'next/server';
import { mockUsers } from '@/app/data/mockData';

// In-memory storage for followers
const followers = new Map<string, Set<string>>();

// Initialize with some mock data
followers.set('batman', new Set(['robin', 'alfred', 'batgirl', 'gordon']));
followers.set('catwoman', new Set(['batman']));
followers.set('joker', new Set(['harley']));

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userFollowers = followers.get(userId) || new Set();
    const followerUsers = mockUsers.filter(u => userFollowers.has(u.username));

    return NextResponse.json(followerUsers);
}

export async function POST(request: Request) {
    const { userId, followerId } = await request.json();

    if (!followers.has(userId)) {
        followers.set(userId, new Set());
    }

    const userFollowers = followers.get(userId)!;
    const wasFollowing = userFollowers.has(followerId);

    if (wasFollowing) {
        userFollowers.delete(followerId);
    } else {
        userFollowers.add(followerId);
    }

    return NextResponse.json({
        following: !wasFollowing,
        followerCount: userFollowers.size
    });
}
