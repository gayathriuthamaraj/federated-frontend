export type PostVisibility = 'PUBLIC' | 'FOLLOWERS' | 'CLOSE_FRIENDS';

export interface Post {
    id: string
    author: string
    content: string
    created_at: string
    updated_at: string
    image_url?: string
    like_count?: number
    reply_count?: number
    repost_count?: number
    has_liked?: boolean
    has_reposted?: boolean
    expires_at?: string | null
    resharing_disabled?: boolean
    visibility?: PostVisibility
    // Multi-server linked posting
    group_id?: string | null
    origin_post?: string | null
    origin_server?: string | null
    replica_servers?: string[]
}
