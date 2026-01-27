import ProfileCard from '@/components/ProfileCard'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string }>
}) {
  const params = await searchParams
  const userId = params.user_id

  if (!userId) {
    return (
      <main className="min-h-screen bg-bat-black flex justify-center">
        <div className="w-full max-w-[600px] border-x border-bat-dark p-6 text-bat-gray">
          <h2 className="text-xl font-bold text-bat-white mb-2">Select a user</h2>
          <p>Choose a user from the search bar to view their profile.</p>
        </div>
      </main>
    )
  }

  const res = await fetch(
    `http://localhost:3000/api/search?user_id=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    return (
      <main className="min-h-screen bg-bat-black flex justify-center">
        <div className="w-full max-w-[600px] border-x border-bat-dark p-6 text-bat-gray">
          <h2 className="text-xl font-bold text-bat-white mb-2">Profile unavailable</h2>
          <p>The requested profile could not be found.</p>
        </div>
      </main>
    )
  }

  const data = await res.json()

  if (!data.profile) {
    return (
      <main className="min-h-screen bg-bat-black flex justify-center">
        <div className="w-full max-w-[600px] border-x border-bat-dark p-6 text-bat-gray">
          <h2 className="text-xl font-bold text-bat-white mb-2">Profile missing</h2>
          <p>No profile data available for this user.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bat-black flex justify-center">
      <div className="w-full max-w-[600px] border-x border-bat-dark min-h-screen flex flex-col">
        {/* Header (optional, but good for Twitter feel) */}
        <div className="sticky top-0 z-10 bg-bat-black/80 backdrop-blur-md border-b border-bat-dark px-4 py-3 cursor-pointer">
          <h2 className="text-lg font-bold text-bat-gray leading-none truncate">
            {data.profile.display_name}
          </h2>
          <span className="text-xs text-bat-gray/50">
            {(data.profile.posts_count || 0) + ' Posts'}
          </span>
        </div>

        <ProfileCard profile={data.profile} />
      </div>
    </main>
  )
}
