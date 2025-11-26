"use client"

import { useEffect, useRef, useState } from "react"
import { Video } from "@/lib/db"

const INTRO_VIDEO_FILENAME = "door_flies_open_and_we_DOLLY_ZOOM_FAST_into_that_door_into_the_theatre_and_delete_the_sign_in_the_th.mp4"

interface IntroLandingProps {
  introVideo: Video | null
  onIntroComplete: () => void
}

export function IntroLanding({ introVideo, onIntroComplete }: IntroLandingProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoState, setVideoState] = useState<"frozen" | "playing" | "transitioning" | "complete">("frozen")
  const [blurAmount, setBlurAmount] = useState(0)
  const [menuOpacity, setMenuOpacity] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !introVideo) return

    const videoUrl = introVideo.video_url || introVideo.blob_url
    if (!videoUrl) {
      console.error("Intro video has no URL")
      return
    }

    video.src = videoUrl
    video.load()

    const handleLoadedMetadata = () => {
      video.currentTime = 0
      video.pause()
      setVideoState("frozen")
      console.log("Intro video loaded, frozen on first frame")
    }

    const handleTimeUpdate = () => {
      if (videoState !== "playing") return

      // Transition starts when camera enters the door - adjust this time based on your video
      // You may need to fine-tune this value
      const transitionStartTime = video.duration * 0.8 // Start transition at 80% of video
      
      if (video.currentTime >= transitionStartTime && videoState === "playing") {
        startTransition()
      }
    }

    const handleEnded = () => {
      setVideoState("complete")
      onIntroComplete()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [introVideo, videoState, onIntroComplete])

  const startTransition = () => {
    if (videoState === "transitioning") return
    setVideoState("transitioning")
    
    // Gradually blur and fade
    const duration = 1500 // ms
    const startTime = Date.now()
    const startBlur = 0
    const endBlur = 20

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setBlurAmount(startBlur + (endBlur - startBlur) * eased)
      setMenuOpacity(eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setVideoState("complete")
        onIntroComplete()
      }
    }

    animate()
  }

  const handlePlayIntro = async () => {
    const video = videoRef.current
    if (!video || videoState !== "frozen") return

    try {
      setVideoState("playing")
      await video.play()
      console.log("Intro video playing")
    } catch (error) {
      console.error("Failed to play intro video:", error)
      setVideoState("frozen")
    }
  }

  if (!introVideo) {
    // If no intro video, skip directly to menu
    return null
  }

  const videoUrl = introVideo.video_url || introVideo.blob_url

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video Background */}
      {videoUrl && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: `blur(${blurAmount}px)`,
            transform: blurAmount > 0 ? "scale(1.05)" : "scale(1)",
          }}
          preload="metadata"
          playsInline
          muted
        />
      )}

      {/* Click to Enter Overlay - Only shown when frozen */}
      {videoState === "frozen" && (
        <div
          onClick={handlePlayIntro}
          className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/10 transition-colors"
        >
          <div className="text-center">
            <p className="text-white text-3xl md:text-5xl font-light tracking-widest animate-pulse mb-4 drop-shadow-lg">
              CLICK TO ENTER
            </p>
            <p className="text-white/80 text-lg md:text-xl font-light tracking-wide drop-shadow-lg">
              Click anywhere to begin
            </p>
          </div>
        </div>
      )}

      {/* Transitioning overlay */}
      {videoState === "transitioning" && (
        <div
          className="absolute inset-0 bg-black/40 z-20 transition-opacity duration-500"
          style={{ opacity: menuOpacity }}
        />
      )}
    </div>
  )
}


