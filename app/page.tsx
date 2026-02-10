'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context/AuthContext'

export default function HomePage() {
  const { identity, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (identity) {
        // Redirect to home/explore if logged in
        router.push('/home')
      } else {
        // Redirect to showcase if not logged in
        router.push('/showcase')
      }
    }
  }, [identity, isLoading, router])

  // Show loading while checking auth
  return (
    <main className="flex items-center justify-center min-h-screen bg-bat-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bat-yellow mb-4"></div>
        <p className="text-bat-gray text-xl">
          Loading...
        </p>
      </div>
    </main>
  )
}
