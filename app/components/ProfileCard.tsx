'use client'

import FollowButton from './FollowButton'
import { Identity } from '@/types/identity'

export default function ProfileCard({ identity }: { identity: Identity }) {
    return (
        <div className="border p-4 max-w-md">
            <h2 className="text-lg font-semibold">{identity.user_id}</h2>
            <p className="text-sm text-gray-500">
                Home server: {identity.home_server}
            </p>

            <FollowButton targetUser={identity.user_id} />
        </div>
    )
}
