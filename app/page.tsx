'use client'

import { useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'

export default function SearchPage() {
  const router = useRouter()

  const onSearch = (userId: string) => {
    router.push(`/profile?user_id=${encodeURIComponent(userId)}`)
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Federated Search</h1>
      <SearchBar onSearch={onSearch} />
    </main>
  )
}
