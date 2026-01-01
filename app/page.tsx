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

  // Mobile: Skip all intro videos and go directly to videos page
  useEffect(() => {
    if (isMobile) {
      router.replace("/videos")
    }
  }, [isMobile, router])

  // BANDWIDTH-SAFE: Preload door video metadata only (not full video)
  // Changed from aggressive preload="auto" + load() to metadata-only to prevent bandwidth spikes
  useEffect(() => {
    const preloadVideo = preloadVideoRef.current
    if (!preloadVideo) return

    // Only preload metadata (duration, dimensions) - NOT the full video file
    preloadVideo.preload = "metadata"
    // DO NOT call load() - let browser handle metadata loading naturally

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
      // Pause preload video on cleanup to prevent play/pause conflicts
      try {
        if (!preloadVideo.paused) {
          preloadVideo.pause()
        }
      } catch (err) {
        // Ignore pause errors during cleanup
      }
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

    // Cut 2.5 seconds off the end - transition when 2.5 seconds before end
    // On mobile, skip door stage and go directly to videos
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        if (isMobile) {
          // Mobile: skip door video, go directly to videos page
          router.push("/videos")
        } else {
          // Desktop: continue to door stage
          setStage("door")
        }
      }
    }

    // Fallback: also handle ended event in case timeupdate doesn't fire
    const handleEnded = () => {
      if (isMobile) {
        // Mobile: skip door video, go directly to videos page
        router.push("/videos")
      } else {
        // Desktop: continue to door stage
        setStage("door")
      }
    }

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
  }, [stage, isMobile, router])

  // Stage 2: Door video (full-screen, click to enter)
  const handleEnter = () => {
    if (started) return

    const video = doorVideoRef.current
    if (!video) {
      console.error("Door video ref is null")
      return
    }

    console.log("Handle enter called, video readyState:", video.readyState)
    console.log("Video src:", video.src)
    console.log("Video networkState:", video.networkState)

    // Check if video is ready to play
    if (video.readyState >= 2) {
      // Video has enough data to play (HAVE_CURRENT_DATA or better)
      setStarted(true)
      video.playbackRate = 1.0
      video.play().catch((err: any) => {
        // Silently ignore AbortError, NotAllowedError, and play/pause interruption errors
        if (err?.name === "AbortError" || 
            err?.name === "NotAllowedError" ||
            err?.message?.includes("interrupted") ||
            err?.message?.includes("pause()")) {
          return
        }
        console.error("Door video play failed:", err)
      })
    } else {
      // Video not ready yet, wait for it
      console.log("Video not ready yet, waiting... current readyState:", video.readyState)
      const checkReady = () => {
        if (video.readyState >= 2) {
          setStarted(true)
          video.playbackRate = 1.0
          video.play().catch((err: any) => {
            // Silently ignore AbortError and NotAllowedError
            if (err?.name === "AbortError" || err?.name === "NotAllowedError") {
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
    console.log("Door video fully completed, navigating to", isMobile ? "videos (mobile)" : "menu (desktop)")
    // Mobile: skip directly to videos page
    // Desktop: go to menu page (original flow)
    if (isMobile) {
      router.push("/videos")
    } else {
      router.push("/menu")
    }
  }

  const handleSkip = () => {
    // Mobile: skip directly to videos page
    // Desktop: go to menu page (original flow)
    if (isMobile) {
      router.push("/videos")
    } else {
      router.push("/menu")
    }
  }

  // Mobile: Don't render anything, redirect happens in useEffect above
  if (isMobile) {
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Stage 1: Splash screen (small video) - Desktop only
  if (stage === "splash") {
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center">
        {/* BANDWIDTH-SAFE: Hidden preload video - metadata only, no full video download */}
        <video
          ref={preloadVideoRef}
          src={ENTER_VIDEO_URL}
          className="hidden"
          preload="metadata"
          muted
          playsInline
        />

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

        {/* Skip intro button */}
        <button
          type="button"
          onClick={handleSkip}
          className={`absolute ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} px-4 py-2.5 text-sm sm:text-base border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black active:scale-95 transition-all z-20 min-h-[44px] min-w-[80px] flex items-center justify-center touch-manipulation`}
        >
          Skip intro
        </button>
      </div>
    )
  }

  // Stage 2: Door video with "CLICK TO ENTER"
  // Note: Uses preload="auto" to show first frame immediately (intro UX requirement)
  // ⚠️ PERMANENT: ENTER_VIDEO_URL is defined in app/config/intro.ts and should NEVER be changed
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
        onLoadStart={() => {
          console.log("Enter video load started")
        }}
        onLoadedData={() => {
          console.log("Enter video loaded data, readyState:", doorVideoRef.current?.readyState)
        }}
        onEnded={handleDoorVideoEnded}
        onError={(e) => {
          const error = e.currentTarget.error
          console.error("Enter video error:", error)
          console.error("Video src:", ENTER_VIDEO_URL)
          console.error("Error code:", error?.code)
          console.error("Error message:", error?.message)
          if (error) {
            switch (error.code) {
              case 1: // MEDIA_ERR_ABORTED
                console.error("Video loading aborted")
                break
              case 2: // MEDIA_ERR_NETWORK
                console.error("Network error while loading video")
                break
              case 3: // MEDIA_ERR_DECODE
                console.error("Error decoding video")
                break
              case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                console.error("Video format not supported")
                break
            }
          }
        }}
        onWaiting={() => {
          console.log("Enter video waiting for data")
        }}
        onLoadedMetadata={(e) => {
          // Play at normal speed (1.0x) - no speed increase
          e.currentTarget.playbackRate = 1.0
          console.log("Door video loaded metadata, duration:", e.currentTarget.duration)
          console.log("Door video URL:", ENTER_VIDEO_URL)
          console.log("Video readyState:", e.currentTarget.readyState)
          // If preload video exists, copy its buffered data
          if (preloadVideoRef.current && preloadVideoRef.current.readyState >= 3) {
            console.log("Using preloaded video data")
          }
        }}
        onCanPlay={(e) => {
          console.log("Door video can play now, readyState:", e.currentTarget.readyState)
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
          className="absolute inset-0 flex items-center justify-center text-center text-white bg-black/40 z-10 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation active:bg-black/50"
          aria-label="Click to enter"
        >
          <span className={`${isMobile ? 'text-base sm:text-lg' : 'text-lg md:text-xl'} tracking-[0.15em] sm:tracking-[0.2em] font-light opacity-90 hover:opacity-100 active:opacity-100 transition-opacity pointer-events-none`}>
            {isMobile ? 'TAP TO ENTER' : 'CLICK TO ENTER'}
          </span>
        </button>
      )}

      {/* Skip intro button - always visible */}
      <button
        type="button"
        onClick={handleSkip}
        className={`absolute ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} px-4 py-2.5 text-sm sm:text-base border border-white/60 rounded-full bg-black/50 text-white hover:bg-white hover:text-black active:scale-95 transition-all z-20 min-h-[44px] min-w-[80px] flex items-center justify-center touch-manipulation`}
      >
        Skip intro
      </button>
    </div>
  )
}
