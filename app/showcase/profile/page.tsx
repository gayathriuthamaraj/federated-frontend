"use client";

import ProfileCard from '../../components/ProfileCard';
import { mockUsers, mockPosts } from '../../data/mockData';
import { Profile } from '@/types/profile';
import { Post } from '@/types/post';

export default function ShowcaseProfilePage() {
    const user = mockUsers[0]; 

    
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
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), 
        updated_at: new Date().toISOString(),
    };

    
    const userPosts: Post[] = mockPosts
        .filter(post => post.author === `${user.username}@gotham.social`)
        .map(post => ({
            id: post.id,
            author: post.author,
            content: post.content,
            image_url: post.imageUrl,
            created_at: post.created_at,
            updated_at: post.updated_at,
        }));

    return <ProfileCard profile={profile} isOwnProfile={true} posts={userPosts} />;
}
