"use client"

import { useRouter } from "next/navigation"
import { useRef, useEffect } from "react"

const MENU_BACKGROUND_VIDEO_URL = "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/circsumenupagebackgroundmp4.mp4"

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
      className="px-8 py-4 border border-red-600 rounded-lg text-base font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif', letterSpacing: '-0.06em' }}
    >
      {label}
    </button>
  )
}

export default function MainMenuPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Auto-play video when it loads
    const handleCanPlay = async () => {
      try {
        await video.play()
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Menu background video auto-play failed:", err)
        }
      }
    }

    video.addEventListener("canplay", handleCanPlay)
    
    // Try to play immediately if already loaded
    if (video.readyState >= 3) {
      handleCanPlay()
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [])

  return (
    <main className="relative min-h-screen bg-white flex flex-col items-center justify-center gap-12 overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        src={MENU_BACKGROUND_VIDEO_URL}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/80 z-0" />

      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif', letterSpacing: '-0.06em' }}>CIRCUS17</h1>
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <MenuButton label="Recent Work" category="recent-work" />
        <MenuButton label="Music" category="music-video" />
        <MenuButton label="Launch Videos" category="industry-work" />
        <MenuButton label="Clothing" category="clothing" />
      </div>
    </main>
  )
}
