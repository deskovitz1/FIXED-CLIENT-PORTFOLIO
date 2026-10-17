"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
// Intro video URLs are configured in app/config/intro.ts
import { SPLASH_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const isMobile = useIsMobile()
  const splashVideoRef = useRef<HTMLVideoElement | null>(null)
  const hasNavigatedRef = useRef(false)
  const router = useRouter()

  // Mobile: Skip all intro videos and go directly to videos page
  useEffect(() => {
    if (isMobile) {
      router.replace("/videos")
    }
  }, [isMobile, router])

  // Prepare the existing destination while the tent animation plays.
  useEffect(() => {
    if (!isMobile) router.prefetch("/menu")
  }, [isMobile, router])

  useEffect(() => {
    const video = splashVideoRef.current
    if (!video || isMobile) return

    // Set playback speed to 1.25x (25% faster)
    video.playbackRate = 1.25

    // Auto-play when video can play
    const handleCanPlay = async () => {
      try {
        await video.play()
      } catch (err: any) {
        // Silently ignore AbortError, NotAllowedError, and play/pause interruption errors
        if (err?.name === "AbortError" || 
            err?.name === "NotAllowedError" ||
            err?.message?.includes("interrupted") ||
            err?.message?.includes("pause()")) {
          return
        }
        console.error("Splash auto-play failed:", err)
      }
    }

    const finishIntro = () => {
      if (hasNavigatedRef.current) return
      hasNavigatedRef.current = true
      video.pause()
      router.replace("/menu")
    }

    // Preserve the tent animation's existing endpoint (2.5 seconds before file end).
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        finishIntro()
      }
    }

    const handleEnded = finishIntro

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
      // Pause video on cleanup to prevent play/pause conflicts
      try {
        if (!video.paused) {
          video.pause()
        }
      } catch (err) {
        // Ignore pause errors during cleanup
      }
    }
  }, [isMobile, router])

  // Mobile: Don't render anything, redirect happens in useEffect above
  if (isMobile) {
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        {/* BANDWIDTH-SAFE: Small centered video - metadata preload, autoplay only for intro UX */}
        {/* ⚠️ PERMANENT: SPLASH_VIDEO_URL is defined in app/config/intro.ts and should NEVER be changed */}
        <div className={`${isMobile ? 'w-[90vw] h-[50vh] min-w-[280px] min-h-[200px]' : 'w-[60vw] h-[60vh] max-w-[1200px] max-h-[1200px] min-w-[400px] min-h-[400px]'}`}>
          <video
            ref={splashVideoRef}
            src={SPLASH_VIDEO_URL}
            className="w-full h-full object-contain"
            playsInline
            muted={true}
            controls={false}
            autoPlay
            preload="metadata"
            onLoadedMetadata={(e) => {
              console.log("Splash video loaded, duration:", e.currentTarget.duration)
              e.currentTarget.playbackRate = 1.25
            }}
            onError={(e) => {
              console.error("Splash video error:", e.currentTarget.error)
              console.error("Video src:", SPLASH_VIDEO_URL)
            }}
            onCanPlay={() => {
              console.log("Splash video can play")
            }}
            onCanPlayThrough={() => {
              console.log("Splash video fully buffered")
            }}
          />
        </div>

    </div>
  )
}
