"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
// Intro video URLs are configured in app/config/intro.ts
import { SPLASH_VIDEO_URL, ENTER_VIDEO_URL } from "@/app/config/intro"

export default function IntroLanding() {
  const isMobile = useIsMobile()
  const [stage, setStage] = useState<"splash" | "door">("splash")
  const [started, setStarted] = useState(false)
  const [doorVideoReady, setDoorVideoReady] = useState(false)
  const splashVideoRef = useRef<HTMLVideoElement | null>(null)
  const doorVideoRef = useRef<HTMLVideoElement | null>(null)
  const preloadVideoRef = useRef<HTMLVideoElement | null>(null)
  const router = useRouter()

  // Aggressive preloading: Start loading door video immediately on mount
  useEffect(() => {
    const preloadVideo = preloadVideoRef.current
    if (!preloadVideo) return

    // Force aggressive preloading
    preloadVideo.preload = "auto"
    preloadVideo.load() // Force load start

    const handleCanPlayThrough = () => {
      console.log("Door video preloaded and ready!")
      setDoorVideoReady(true)
    }

    const handleProgress = () => {
      const video = preloadVideo
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const duration = video.duration
        if (duration > 0) {
          const percentLoaded = (bufferedEnd / duration) * 100
          console.log(`Door video loading: ${percentLoaded.toFixed(1)}%`)
        }
      }
    }

    preloadVideo.addEventListener("canplaythrough", handleCanPlayThrough)
    preloadVideo.addEventListener("progress", handleProgress)

    return () => {
      preloadVideo.removeEventListener("canplaythrough", handleCanPlayThrough)
      preloadVideo.removeEventListener("progress", handleProgress)
    }
  }, [])

  // Stage 1: Splash video (small, auto-plays, auto-navigates to door stage)
  useEffect(() => {
    const video = splashVideoRef.current
    if (!video || stage !== "splash") return

    // Set playback speed to 1.25x (25% faster)
    video.playbackRate = 1.25

    // Auto-play when video can play
    const handleCanPlay = async () => {
      try {
        await video.play()
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Splash auto-play failed:", err)
        }
      }
    }

    // Cut 2.5 seconds off the end - transition when 2.5 seconds before end
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        setStage("door")
      }
    }

    // Fallback: also handle ended event in case timeupdate doesn't fire
    const handleEnded = () => {
      setStage("door")
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [stage])

  // Stage 2: Door video (full-screen, click to enter)
  const handleEnter = () => {
    if (started) return

    const video = doorVideoRef.current
    if (!video) return

    // Check if video is ready to play
    if (video.readyState >= 3) {
      // Video is ready, start playing
      setStarted(true)
      video.playbackRate = 1.0
      video.play().catch((err: any) => {
        if (err?.name === "AbortError") {
          console.warn("Door video play aborted (AbortError), ignoring.")
          return
        }
        console.error("Door video play failed:", err)
      })
    } else {
      // Video not ready yet, wait for it
      console.log("Video not ready yet, waiting...")
      const checkReady = () => {
        if (video.readyState >= 3) {
          setStarted(true)
          video.playbackRate = 1.0
          video.play().catch((err: any) => {
            if (err?.name === "AbortError") {
              console.warn("Door video play aborted (AbortError), ignoring.")
              return
            }
            console.error("Door video play failed:", err)
          })
        } else {
          setTimeout(checkReady, 100)
        }
      }
      checkReady()
    }
  }

  const handleDoorVideoEnded = () => {
    console.log("Door video fully completed, navigating to menu")
    router.push("/menu")
  }

  const handleSkip = () => {
    router.push("/menu")
  }

  // Stage 1: Splash screen (small video)
  if (stage === "splash") {
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        {/* Hidden preload video - starts loading immediately */}
        <video
          ref={preloadVideoRef}
          src={ENTER_VIDEO_URL}
          className="hidden"
          preload="auto"
          muted
          playsInline
        />

        {/* Small centered video - responsive sizing */}
        <div className={`${isMobile ? 'w-[90vw] h-[50vh] min-w-[280px] min-h-[200px]' : 'w-[60vw] h-[60vh] max-w-[1200px] max-h-[1200px] min-w-[400px] min-h-[400px]'}`}>
          <video
            ref={splashVideoRef}
            src={SPLASH_VIDEO_URL}
            className="w-full h-full object-contain"
            playsInline
            muted={true}
            controls={false}
            autoPlay
            preload="auto"
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

        {/* Skip intro button */}
        <button
          type="button"
          onClick={handleSkip}
          className={`absolute ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} px-3 sm:px-4 py-2 text-xs sm:text-sm border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition z-20 min-h-[44px] min-w-[44px] flex items-center justify-center`}
        >
          Skip intro
        </button>
      </div>
    )
  }

  // Stage 2: Door video with "CLICK TO ENTER"
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <video
        ref={doorVideoRef}
        src={ENTER_VIDEO_URL}
        className="w-full h-full object-cover"
        playsInline
        muted={true}
        controls={false}
        preload="auto"
        onEnded={handleDoorVideoEnded}
        onWaiting={() => {
          console.log("Enter video waiting for data")
        }}
        onCanPlayThrough={() => {
          console.log("Enter video fully buffered")
        }}
        onLoadedMetadata={(e) => {
          // Play at normal speed (1.0x) - no speed increase
          e.currentTarget.playbackRate = 1.0
          console.log("Door video loaded, duration:", e.currentTarget.duration)
          // If preload video exists, copy its buffered data
          if (preloadVideoRef.current && preloadVideoRef.current.readyState >= 3) {
            console.log("Using preloaded video data")
          }
        }}
        onCanPlay={(e) => {
          console.log("Door video can play now")
          setDoorVideoReady(true)
        }}
        onCanPlayThrough={() => {
          console.log("Door video fully buffered and ready")
          setDoorVideoReady(true)
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget
          // Log progress for debugging
          if (video.duration) {
            const progress = (video.currentTime / video.duration) * 100
            if (progress > 90) {
              console.log("Door video near end:", progress.toFixed(1) + "%")
            }
          }
        }}
      />

      {/* Overlay text before start */}
      {!started && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute inset-0 flex items-center justify-center text-center text-white bg-black/20 z-10 min-h-[44px] min-w-[44px]"
        >
          <span className={`${isMobile ? 'text-xs' : 'text-sm md:text-base'} tracking-[0.15em] sm:tracking-[0.2em] font-light opacity-90 hover:opacity-100 transition-opacity`}>
            {isMobile ? 'TAP TO ENTER' : 'CLICK TO ENTER'}
          </span>
        </button>
      )}

      {/* Skip intro button - always visible */}
      <button
        type="button"
        onClick={handleSkip}
        className={`absolute ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} px-3 sm:px-4 py-2 text-xs sm:text-sm border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition z-20 min-h-[44px] min-w-[44px] flex items-center justify-center`}
      >
        Skip intro
      </button>
    </div>
  )
}
