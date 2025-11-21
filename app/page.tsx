"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { INTRO_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const [started, setStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  const handleEnter = () => {
    setStarted(true)
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Intro play failed:", err)
      })
    }
  }

  const handleEnded = () => {
    router.push("/videos")
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        className="w-full h-full object-cover"
        onEnded={handleEnded}
        playsInline
        muted={false}
        controls={false}
      />

      {!started && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute inset-0 flex items-center justify-center text-white text-xl bg-black/50"
        >
          Click to enter
        </button>
      )}
    </div>
  )
}
