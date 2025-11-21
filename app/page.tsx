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

    const video = videoRef.current
    if (!video) return

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
