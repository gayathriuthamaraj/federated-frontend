// Mock data for frontend showcase
export interface MockUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bannerUrl: string;
    bio: string;
    location: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isFollowing?: boolean;
}

export interface MockPost {
    id: string;
    author: string; // Changed to string format like "batman@gotham.social"
    content: string;
    imageUrl?: string;
    likeCount: number;
    commentCount: number;
    repostCount: number;
    isLiked?: boolean;
    isReposted?: boolean;
    timestamp: string;
    created_at: string; // Added for PostCard compatibility
    updated_at: string; // Added for PostCard compatibility
}

export interface MockNotification {
    id: string;
    type: 'like' | 'follow' | 'comment' | 'repost';
    user: MockUser;
    post?: MockPost;
    timestamp: string;
    isRead: boolean;
}

export interface MockMessage {
    id: string;
    user: MockUser;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
}

// Sample Users
export const mockUsers: MockUser[] = [
    {
        id: '1',
        username: 'batman',
        displayName: 'The Dark Knight',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=batman',
        bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop',
        bio: 'Gotham\'s protector. Justice never sleeps. 🦇',
        location: 'Gotham City',
        followersCount: 15420,
        followingCount: 89,
        postsCount: 342,
    },
    {
        id: '2',
        username: 'robin',
        displayName: 'Robin - Boy Wonder',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robin',
        bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&h=400&fit=crop',
        bio: 'Sidekick extraordinaire. Learning from the best! 🎯',
        location: 'Gotham City',
        followersCount: 8234,
        followingCount: 156,
        postsCount: 521,
        isFollowing: true,
    },
    {
        id: '3',
        username: 'catwoman',
        displayName: 'Selina Kyle',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=catwoman',
        bannerUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=400&fit=crop',
        bio: 'Cat burglar with a heart. Sometimes. 😼',
        location: 'Gotham City',
        followersCount: 12890,
        followingCount: 234,
        postsCount: 678,
        isFollowing: false,
    },
    {
        id: '4',
        username: 'joker',
        displayName: 'The Joker',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joker',
        bannerUrl: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=1200&h=400&fit=crop',
        bio: 'Why so serious? 🃏 Chaos is my art.',
        location: 'Arkham Asylum',
        followersCount: 9876,
        followingCount: 12,
        postsCount: 1234,
        isFollowing: false,
    },
    {
        id: '5',
        username: 'alfred',
        displayName: 'Alfred Pennyworth',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alfred',
        bannerUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200&h=400&fit=crop',
        bio: 'Butler, confidant, and voice of reason. ☕',
        location: 'Wayne Manor',
        followersCount: 5432,
        followingCount: 45,
        postsCount: 234,
        isFollowing: true,
    },
    {
        id: '6',
        username: 'harley',
        displayName: 'Harley Quinn',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=harley',
        bannerUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=400&fit=crop',
        bio: 'Puddin\'s number one! Chaos and fun! 🎪💕',
        location: 'Gotham City',
        followersCount: 11234,
        followingCount: 89,
        postsCount: 892,
        isFollowing: false,
    },
    {
        id: '7',
        username: 'gordon',
        displayName: 'Commissioner Gordon',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gordon',
        bannerUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=400&fit=crop',
        bio: 'GCPD Commissioner. Keeping Gotham safe. 🚔',
        location: 'Gotham City',
        followersCount: 7890,
        followingCount: 123,
        postsCount: 456,
        isFollowing: true,
    },
    {
        id: '8',
        username: 'batgirl',
        displayName: 'Batgirl',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=batgirl',
        bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop',
        bio: 'Oracle. Tech genius. Crime fighter. 💻🦇',
        location: 'Gotham City',
        followersCount: 9456,
        followingCount: 178,
        postsCount: 634,
        isFollowing: true,
    },
];

// Sample Posts
export const mockPosts: MockPost[] = [
    {
        id: '1',
        author: 'batman@gotham.social',
        content: 'Another night, another patrol. Gotham never sleeps, and neither do I. Stay vigilant, citizens.',
        imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=400&fit=crop',
        likeCount: 1234,
        commentCount: 89,
        repostCount: 234,
        isLiked: true,
        timestamp: '2h ago',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        author: 'robin@gotham.social',
        content: 'Training session complete! Batman says I\'m getting better every day. Time to hit the streets! 💪',
        likeCount: 567,
        commentCount: 45,
        repostCount: 78,
        isLiked: false,
        timestamp: '4h ago',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        author: 'catwoman@gotham.social',
        content: 'Just acquired a beautiful diamond necklace. Finders keepers? 😏✨',
        imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop',
        likeCount: 892,
        commentCount: 123,
        repostCount: 156,
        isLiked: true,
        timestamp: '6h ago',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '4',
        author: 'joker@arkham.social',
        content: 'HAHAHAHA! Why so serious, Gotham? Let\'s put a smile on that face! 🃏',
        likeCount: 445,
        commentCount: 234,
        repostCount: 89,
        isLiked: false,
        timestamp: '8h ago',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '5',
        author: 'alfred@wayne.manor',
        content: 'Master Wayne, your tea is ready. And might I suggest getting some rest? Even heroes need sleep.',
        likeCount: 678,
        commentCount: 56,
        repostCount: 34,
        isLiked: true,
        timestamp: '12h ago',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
];

// Sample Notifications
export const mockNotifications: MockNotification[] = [
    {
        id: '1',
        type: 'like',
        user: mockUsers[1],
        post: mockPosts[0],
        timestamp: '5m ago',
        isRead: false,
    },
    {
        id: '2',
        type: 'follow',
        user: mockUsers[7],
        timestamp: '15m ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'comment',
        user: mockUsers[2],
        post: mockPosts[0],
        timestamp: '1h ago',
        isRead: true,
    },
    {
        id: '4',
        type: 'repost',
        user: mockUsers[4],
        post: mockPosts[0],
        timestamp: '2h ago',
        isRead: true,
    },
    {
        id: '5',
        type: 'like',
        user: mockUsers[6],
        post: mockPosts[1],
        timestamp: '3h ago',
        isRead: true,
    },
];

// Sample Messages
export const mockMessages: MockMessage[] = [
    {
        id: '1',
        user: mockUsers[1],
        lastMessage: 'Ready for tonight\'s patrol?',
        timestamp: '2m ago',
        unreadCount: 2,
    },
    {
        id: '2',
        user: mockUsers[4],
        lastMessage: 'Master Wayne, dinner is served.',
        timestamp: '1h ago',
        unreadCount: 0,
    },
    {
        id: '3',
        user: mockUsers[6],
        lastMessage: 'We need to talk about the Joker situation.',
        timestamp: '3h ago',
        unreadCount: 1,
    },
    {
        id: '4',
        user: mockUsers[2],
        lastMessage: 'Meet me on the rooftop tonight? 😉',
        timestamp: '5h ago',
        unreadCount: 0,
    },
];
