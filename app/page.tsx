"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Intro video URL is configured in app/config/intro.ts
// To change the intro video, update INTRO_VIDEO_URL in that file
import { INTRO_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  // Auto-play video when it loads and navigate when it ends
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set playback speed to 1.25x (25% faster)
    video.playbackRate = 1.25

    // Auto-play when video can play
    const handleCanPlay = async () => {
      try {
        await video.play()
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Auto-play failed:", err)
        }
      }
    }

    // Navigate to /videos when video ends
    const handleEnded = () => {
      router.push("/videos")
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("ended", handleEnded)
    }
  }, [router])

  const handleSkip = () => {
    router.push("/videos")
  }

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center">
      {/* Small centered video - 20% of screen size (500% smaller) */}
      <div className="w-[20vw] h-[20vh] max-w-[400px] max-h-[400px] min-w-[200px] min-h-[200px]">
        <video
          ref={videoRef}
          src={INTRO_VIDEO_URL}
          className="w-full h-full object-contain"
          playsInline
          muted={true}
          controls={false}
          autoPlay
          onLoadedMetadata={(e) => {
            // Set playback speed to 1.25x (25% faster) when video metadata loads
            e.currentTarget.playbackRate = 1.25
          }}
        />
      </div>

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
