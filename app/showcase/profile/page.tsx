"use client";

import ProfileCard from '../../components/ProfileCard';
import { mockUsers, mockPosts, mockReplies } from '../../data/mockData';
import { Profile } from '@/types/profile';
import { Post } from '@/types/post';

export default function ShowcaseProfilePage() {
    const user = mockUsers[0]; // Batman

    // Convert MockUser to Profile type
    const profile: Profile = {
        user_id: user.username,
        display_name: user.displayName,
        bio: user.bio,
        avatar_url: user.avatarUrl,
        banner_url: user.bannerUrl,
        location: user.location,
        portfolio_url: '',
        followers_count: user.followersCount,
        following_count: user.followingCount,
        followers_visibility: 'public',
        following_visibility: 'public',
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
        updated_at: new Date().toISOString(),
    };

    // Filter posts and replies by this user and convert to Post type
    const userPosts: Post[] = [
        ...mockPosts.filter(post => post.author === `${user.username}@gotham.social`),
        ...mockReplies.filter(reply => reply.author === `${user.username}@gotham.social`)
    ].map(post => ({
        id: post.id,
        author: post.author,
        content: post.content,
        image_url: post.imageUrl,
        created_at: post.created_at,
        updated_at: post.updated_at,
        like_count: post.likeCount,
        reply_count: post.commentCount,
        repost_count: post.repostCount,
        has_liked: post.isLiked,
        has_reposted: post.isReposted,
        reply_to: (post as any).replyTo, // Map replyTo if it exists
        is_repost: false // Mock data doesn't explicitly flag reposts in main definition yet, defaults to false
    }));

    return <ProfileCard profile={profile} isOwnProfile={true} posts={userPosts} />;
}
