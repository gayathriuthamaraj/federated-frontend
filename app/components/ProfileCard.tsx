'use client'

import FollowButton from './FollowButton'
import { Profile } from '@/types/profile'

export default function ProfileCard({ profile }: { profile: Profile }) {
    return (
        <div
            className="
        w-full max-w-2xl
        bg-bat-black
        border border-bat-dark
        rounded-xl
        overflow-hidden
      "
        >
            {/* Header / Banner */}
            <div className="h-32 bg-bat-dark" />

            {/* Profile main */}
            <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div
                    className="
            absolute -top-12
            h-24 w-24 rounded-full
            bg-bat-black
            border-4 border-bat-black
            flex items-center justify-center
            text-3xl font-semibold
            text-bat-yellow
            shadow-[0_0_15px_rgba(0,0,0,0.8)]
          "
                >
                    {profile.display_name?.[0]?.toUpperCase() ?? 'U'}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4">
                    <FollowButton targetUser={profile.user_id} />
                </div>

                {/* Identity */}
                <div className="mt-10">
                    <h2 className="text-xl font-semibold text-bat-yellow tracking-wide">
                        {profile.display_name ?? profile.user_id}
                    </h2>
                    <p className="text-sm text-bat-gray tracking-wide">
                        @{profile.user_id}
                    </p>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="mt-4 text-sm text-bat-gray leading-relaxed">
                        {profile.bio}
                    </p>
                )}

                {/* Meta (placeholder for later: join date, followers, etc.) */}
                <div className="mt-4 text-xs text-bat-gray/70">
                    {/* intentionally empty for now */}
                </div>
            </div>
        </div>
    )
}
