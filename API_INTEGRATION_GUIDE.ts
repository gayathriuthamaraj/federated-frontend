// API Integration Template
// Copy this file and replace mock data with real API calls

/**
 * Example: Converting Feed Page from Mock to Real API
 */

// BEFORE (Mock Data):
import { mockPosts } from '../../data/mockData';

export default function FeedPage() {
    return (
        <div>
        {
            mockPosts.map(post => (
                <PostCard key= { post.id } post = { post } />
            ))
        }
        </div>
    );
}

// AFTER (Real API):
'use client';

import { useState, useEffect } from 'react';
import PostCard from '../../components/PostCard';
import { Post } from '@/types/post';

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/feed', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch feed');

            const data = await response.json();
            setPosts(data.posts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className= "flex justify-center items-center h-screen" >
            <div className="text-bat-gray" > Loading feed...</div>
                </div>
        );
    }

    if (error) {
        return (
            <div className= "flex justify-center items-center h-screen" >
            <div className="text-red-500" > Error: { error } </div>
                </div>
        );
    }

    return (
        <div className= "max-w-3xl mx-auto" >
        {/* Compose Box */ }
        < ComposePost onPostCreated = { fetchFeed } />

            {/* Feed */ }
    {
        posts.length === 0 ? (
            <div className= "text-center py-12 text-bat-gray/60" >
            No posts yet.Follow some users to see their posts!
                </div>
            ) : (
            posts.map(post => (
                <PostCard key= { post.id } post = { post } />
                ))
            )
    }
    </div>
    );
}

/**
 * Example: API Service Layer
 * Create this in app/services/api.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    // Posts
    async getFeed() {
        return this.request<{ posts: Post[] }>('/api/feed');
    }

    async createPost(content: string, imageUrl?: string) {
        return this.request<Post>('/api/posts', {
            method: 'POST',
            body: JSON.stringify({ content, image_url: imageUrl }),
        });
    }

    async likePost(postId: string) {
        return this.request(`/api/posts/${postId}/like`, {
            method: 'POST',
        });
    }

    async commentOnPost(postId: string, content: string) {
        return this.request(`/api/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async repost(postId: string) {
        return this.request(`/api/posts/${postId}/repost`, {
            method: 'POST',
        });
    }

    // Users
    async getProfile(userId: string) {
        return this.request<Profile>(`/api/users/${userId}`);
    }

    async updateProfile(userId: string, data: Partial<Profile>) {
        return this.request<Profile>(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async followUser(userId: string) {
        return this.request(`/api/users/${userId}/follow`, {
            method: 'POST',
        });
    }

    async unfollowUser(userId: string) {
        return this.request(`/api/users/${userId}/follow`, {
            method: 'DELETE',
        });
    }

    async getFollowers(userId: string) {
        return this.request<{ users: User[] }>(`/api/users/${userId}/followers`);
    }

    async getFollowing(userId: string) {
        return this.request<{ users: User[] }>(`/api/users/${userId}/following`);
    }

    // Notifications
    async getNotifications() {
        return this.request<{ notifications: Notification[] }>('/api/notifications');
    }

    async markNotificationRead(notificationId: string) {
        return this.request(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }

    // Messages
    async getConversations() {
        return this.request<{ conversations: Conversation[] }>('/api/messages');
    }

    async getMessages(conversationId: string) {
        return this.request<{ messages: Message[] }>(`/api/messages/${conversationId}`);
    }

    async sendMessage(recipientId: string, content: string) {
        return this.request('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ recipient_id: recipientId, content }),
        });
    }

    // Search
    async search(query: string, type: 'users' | 'posts' = 'users') {
        return this.request(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
    }

    async getTrending() {
        return this.request('/api/explore/trending');
    }

    // Auth
    async login(username: string, password: string) {
        return this.request<{ token: string; user: User }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST',
        });
    }

    async getCurrentUser() {
        return this.request<User>('/api/auth/me');
    }
}

export const api = new ApiService();

/**
 * Example: Using the API Service in a Component
 */

import { api } from '@/services/api';

function FollowButton({ userId }: { userId: string }) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);
        try {
            if (isFollowing) {
                await api.unfollowUser(userId);
                setIsFollowing(false);
            } else {
                await api.followUser(userId);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Follow error:', error);
            // Show error toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick= { handleFollow } disabled = { loading } >
            { loading? 'Loading...': isFollowing ? 'Following' : 'Follow' }
            </button>
    );
}

/**
 * Example: Environment Variables
 * Create .env.local file:
 */

// NEXT_PUBLIC_API_URL=http://localhost:8000
// NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

/**
 * Example: Error Handling Hook
 */

function useApiCall<T>(apiCall: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall();
            setData(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, execute };
}

// Usage:
const { data, loading, error, execute } = useApiCall(() => api.getFeed());

useEffect(() => {
    execute();
}, []);
