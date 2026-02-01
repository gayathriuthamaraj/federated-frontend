'use client'

export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-bat-black">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-bat-yellow mb-4">
          GOTHAM SOCIAL
        </h1>
        <p className="text-bat-gray text-xl">
          Welcome to the federated social network
        </p>
        <div className="mt-8 text-bat-gray/60 text-sm">
          Use the sidebar to navigate
        </div>
      </div>
    </main>
  )
}
