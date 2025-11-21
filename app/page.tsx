"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { INTRO_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const [started, setStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  const handleEnter = () => {
    // prevent double-click spam
    if (started) return
    setStarted(true)

    // Try to play video (optional, doesn't block navigation)
    const video = videoRef.current
    if (video) {
      video.play().catch((err) => {
        console.error("Intro play failed:", err)
      })
    }

    // Always navigate to menu after short delay, regardless of video state
    setTimeout(() => {
      console.log("Navigating to /menu")
      router.push("/menu")
    }, 500) // 500ms delay
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        className="w-full h-full object-cover"
        playsInline
        muted={true}
        controls={false}
        // IMPORTANT: no loop, no autoPlay, no onEnded
      />

      {/* Overlay text before start */}
      {!started && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black/40"
        >
          <span className="text-4xl md:text-5xl tracking-[0.3em] mb-3">
            CLICK TO ENTER
          </span>
          <span className="text-lg opacity-80">
            Click anywhere to begin
          </span>
        </button>
      )}
    </div>
  )
}
