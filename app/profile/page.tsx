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
      <main className="p-6 text-bat-gray">
        No user selected
      </main>
    )
  }

  const res = await fetch(
    `http://localhost:3000/api/search?user_id=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    return (
      <main className="p-6 text-bat-gray">
        Profile unavailable
      </main>
    )
  }

  const data = await res.json()

  if (!data.profile) {
    return (
      <main className="p-6 text-bat-gray">
        No profile data found
      </main>
    )
  }

  return (
    <main className="p-6 flex justify-center">
      <ProfileCard profile={data.profile} />
    </main>
  )
}
