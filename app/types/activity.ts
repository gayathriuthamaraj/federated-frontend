export interface Activity {
    id: string
    actor_id: string
    verb: 'FOLLOW' | 'POST' | 'MESSAGE' | 'PROFILE_UPDATE'
    object_type?: string | null
    object_id?: string | null
    target_id?: string | null
    payload?: any
    created_at: string
}
