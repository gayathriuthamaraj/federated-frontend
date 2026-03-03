export interface Message {
    id: string
    sender: string
    receiver: string
    content: string
    image_url?: string | null
    created_at: string
}
