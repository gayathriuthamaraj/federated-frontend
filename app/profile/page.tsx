import ProfileCard from '@/components/ProfileCard'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string }>
}) {
  const params = await searchParams
  const userId = params.user_id

  if (!userId) {
    return <div>No user selected</div>
  }

  const res = await fetch(
    `http://localhost:3000/api/search?user_id=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    return <div>Profile unavailable</div>
  }

  const identity = await res.json()

  return (
    <main className="p-6">
      <ProfileCard identity={identity} />
    </main>
  )
}

