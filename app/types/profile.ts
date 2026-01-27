export interface Profile {
    user_id: string
    display_name: string

    avatar_url?: string | null
    banner_url?: string | null
    bio?: string | null
    portfolio_url?: string | null
    birth_date?: string | null
    location?: string | null

    followers_visibility: 'public' | 'followers' | 'private'
    following_visibility: 'public' | 'followers' | 'private'

    created_at: string
    updated_at: string

    followers_count?: number
    following_count?: number
}
