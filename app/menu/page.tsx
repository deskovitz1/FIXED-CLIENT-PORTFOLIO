"use client"

import { useRouter } from "next/navigation"

function MenuButton({ 
  label, 
  category 
}: { 
  label: string
  category?: string 
}) {
  const router = useRouter()

  const handleClick = () => {
    if (category) {
      router.push(`/videos?category=${encodeURIComponent(category)}`)
    } else {
      router.push("/videos")
    }
  }

  return (
    <button
      onClick={handleClick}
      className="px-8 py-4 border border-white/30 rounded-lg text-base font-light tracking-[0.1em] hover:bg-white hover:text-black transition-all duration-300 hover:border-white"
    >
      {label}
    </button>
  )
}

export default function MainMenuPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-12">
      <h1 className="text-2xl font-bold opacity-90" style={{ fontFamily: 'Helvetica, Arial, sans-serif', letterSpacing: '-60px' }}>CIRCUS17</h1>
      <div className="flex flex-col gap-4">
        <MenuButton label="Recent Work" category="recent-work" />
        <MenuButton label="Music" category="music-video" />
        <MenuButton label="Launch Videos" category="industry-work" />
        <MenuButton label="Clothing" category="clothing" />
      </div>
    </main>
  )
}
