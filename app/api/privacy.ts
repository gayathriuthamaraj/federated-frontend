// Privacy settings API helpers

export interface PrivacySettings {
    user_id: string;
    /** 'everyone' | 'hidden' — whether you appear in local (same-server) search */
    search_local: string;
    /** 'everyone' | 'hidden' — whether you appear in cross-server federated search */
    search_federated: string;
    /** 'public' | 'followers' | 'private' */
    posts_visibility: string;
    /** 'public' | 'followers' | 'private' */
    likes_visibility: string;
    /** 'public' | 'followers' | 'private' */
    replies_visibility: string;
    /** 'public' | 'followers' | 'private' */
    following_list_visibility: string;
    /** 'public' | 'followers' | 'private' */
    followers_list_visibility: string;
    created_at?: string;
    updated_at?: string;
}

export const defaultPrivacySettings = (): PrivacySettings => ({
    user_id: '',
    search_local: 'everyone',
    search_federated: 'everyone',
    posts_visibility: 'public',
    likes_visibility: 'public',
    replies_visibility: 'public',
    following_list_visibility: 'public',
    followers_list_visibility: 'public',
});

export async function fetchPrivacySettings(homeServer: string, accessToken: string): Promise<PrivacySettings> {
    const res = await fetch(`${homeServer}/privacy/settings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Failed to load privacy settings (${res.status})`);
    return res.json();
}

export async function savePrivacySettings(
    homeServer: string,
    accessToken: string,
    settings: Omit<PrivacySettings, 'user_id' | 'created_at' | 'updated_at'> & { user_id?: string }
): Promise<PrivacySettings> {
    const res = await fetch(`${homeServer}/privacy/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `Failed to save privacy settings (${res.status})`);
    }
    const data = await res.json();
    return data.settings ?? data;
}
