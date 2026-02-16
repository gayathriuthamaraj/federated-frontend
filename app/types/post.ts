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
    // New fields for frontend logic
    reply_to?: string
    is_repost?: boolean
}
