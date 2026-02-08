const API_BASE_URL = 'http://localhost:8082';

export interface UpdateProfileData {
    user_id: string;
    display_name?: string;
    avatar_url?: string;
    banner_url?: string;
    bio?: string;
    portfolio_url?: string;
    birth_date?: string;
    location?: string;
    followers_visibility?: 'public' | 'private';
    following_visibility?: 'public' | 'private';
}

export async function updateProfile(data: UpdateProfileData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
    }

    return response.json();
}

export async function getUserProfile(userId: string) {
    const response = await fetch(`${API_BASE_URL}/user/me?user_id=${userId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    return response.json();
}
