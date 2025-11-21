"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Intro video URL is configured in app/config/intro.ts
// To change the intro video, update INTRO_VIDEO_URL in that file
import { INTRO_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const [started, setStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  // Set video playback speed to 1.25x (25% faster) when video loads
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.playbackRate = 1.25
    }
  }, [])

  const handleEnter = () => {
    // prevent double-click spam
    if (started) return
    setStarted(true)

    const video = videoRef.current
    if (!video) return

    // Ensure playback rate is set to 1.25x before playing
    video.playbackRate = 1.25

    video.play().catch((err: any) => {
      if (err?.name === "AbortError") {
        // Ignore AbortError, this just means the operation was interrupted
        console.warn("Intro play aborted (AbortError), ignoring.")
        return
      }
      console.error("Intro play failed:", err)
    })
  }

  const handleSkip = () => {
    router.push("/videos")
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
        onLoadedMetadata={(e) => {
          // Set playback speed to 1.25x (25% faster) when video metadata loads
          e.currentTarget.playbackRate = 1.25
        }}
        // IMPORTANT: no loop, no autoPlay
      />

      {/* Overlay text before start */}
      {!started && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black/40 z-10"
        >
          <span className="text-4xl md:text-5xl tracking-[0.3em] mb-3">
            CLICK TO ENTER
          </span>
          <span className="text-lg opacity-80">
            Click anywhere to begin
          </span>
        </button>
      )}

      {/* Skip intro button - always visible */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-6 right-6 px-4 py-2 text-sm border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition z-20"
      >
        Skip intro
      </button>
    </div>
  )
}
