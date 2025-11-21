"use client"

import { useEffect, useRef, useState } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"

// Using the original video URL from before recent changes
const INTRO_VIDEO_URL = "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/A_cinematic__Blender_style_animated_sequence_inside_a_handcrafted_miniature_world__The_scene_begins_%25204K.mp4"

export function VideoHomepage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoState, setVideoState] = useState<"frozen" | "playing" | "blurring" | "ended" | "skipped">("frozen")
  const [isLoaded, setIsLoaded] = useState(false)
  const [blurAmount, setBlurAmount] = useState(0)
  const [buttonsOpacity, setButtonsOpacity] = useState(0)
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showingRecentWork, setShowingRecentWork] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoState === "skipped") return

    // Set video source only if not already set
    if (video.src !== INTRO_VIDEO_URL) {
      video.src = INTRO_VIDEO_URL
      video.load()
    }

    const handleLoadedMetadata = () => {
      // Check if video is still connected and state hasn't changed
      const currentState = videoState
      if (!video.isConnected || currentState === "skipped") return
      
      // Freeze on first frame
      video.currentTime = 0
      video.pause()
      setIsLoaded(true)
      console.log("✅ Video loaded, frozen on first frame")
    }

    const handleTimeUpdate = () => {
      if (videoState !== "playing" || !video.isConnected) return

      // Detect when door opens - adjust this time based on your video
      const doorOpenTime = 8 // seconds - adjust this to match when door opens in your video
      
      if (video.currentTime >= doorOpenTime && videoState === "playing") {
        // Start blurring transition
        setVideoState("blurring")
        startBlurTransition()
      }
    }

    const handleError = (e: Event) => {
      const video = e.target as HTMLVideoElement
      console.error("❌ Video error:", {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        src: video.src,
      })
    }

    // Only add listeners if video is connected
    if (video.isConnected) {
      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("timeupdate", handleTimeUpdate)
      video.addEventListener("error", handleError)
    }

    return () => {
      // Safely remove listeners
      if (video.isConnected) {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("timeupdate", handleTimeUpdate)
        video.removeEventListener("error", handleError)
      }
    }
  }, [videoState])

  const startBlurTransition = () => {
    // Gradually blur and fade in buttons over 1.5 seconds
    const duration = 1500 // ms
    const startTime = Date.now()
    const startBlur = 0
    const endBlur = 20

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic for smooth transition
      const eased = 1 - Math.pow(1 - progress, 3)

      setBlurAmount(startBlur + (endBlur - startBlur) * eased)
      setButtonsOpacity(eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setVideoState("ended")
        setBlurAmount(endBlur)
        setButtonsOpacity(1)
      }
    }

    animate()
  }

  const handleSkip = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
    }
    setVideoState("skipped")
    setBlurAmount(20)
    setButtonsOpacity(1)
  }

  const handlePlayVideo = async () => {
    const video = videoRef.current
    if (!video || videoState !== "frozen") return

    // Check if video is still in the DOM
    if (!video.isConnected) {
      console.warn("⚠️ Video element not in DOM, cannot play")
      return
    }

    try {
      setVideoState("playing")
      
      // Double-check video is still valid before playing
      if (!videoRef.current || !videoRef.current.isConnected) {
        console.warn("⚠️ Video removed before play, aborting")
        setVideoState("frozen")
        return
      }

      await video.play()
      console.log("✅ Video playing")
    } catch (error: any) {
      // Handle AbortError specifically (video was removed)
      if (error.name === "AbortError" || error.message?.includes("interrupted")) {
        console.warn("⚠️ Video play was interrupted (video may have been removed)")
        setVideoState("frozen")
        return
      }
      console.error("❌ Video playback failed:", error)
      setVideoState("frozen")
    }
  }

  const fetchVideos = async (category?: string) => {
    try {
      const url = category 
        ? `/api/videos?category=${encodeURIComponent(category)}`
        : "/api/videos"
      console.log("Fetching videos from:", url)
      const response = await fetch(url)
      const data = await response.json()
      console.log("Fetched videos:", data.videos?.length || 0, "videos")
      setVideos(data.videos || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
      setVideos([])
    }
  }

  const handleRecentWorkClick = async () => {
    setSelectedCategory("recent-work")
    await fetchVideos("recent-work")
    setShowingRecentWork(true)
  }

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category)
    await fetchVideos(category)
    setShowingRecentWork(true)
  }

  // Fetch all videos when showing the gallery (for uncategorized videos)
  const handleShowAllVideos = async () => {
    setSelectedCategory(null)
    await fetchVideos() // Fetch all videos without category filter
    setShowingRecentWork(true)
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
    setIsPlayerOpen(true)
  }

  const handleBackClick = () => {
    setShowingRecentWork(false)
    setSelectedCategory(null)
    setVideos([])
  }

  const showButtons = videoState === "ended" || videoState === "skipped"

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main Video Element - Always render but hide when skipped */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
        style={{
          filter: `blur(${blurAmount}px)`,
          transform: blurAmount > 0 ? "scale(1.05)" : "scale(1)",
          opacity: videoState === "skipped" ? 0 : 1,
          pointerEvents: videoState === "skipped" ? "none" : "auto",
        }}
        preload="metadata"
        playsInline
        muted
        onLoadedMetadata={() => {
          const video = videoRef.current
          if (video && videoState !== "skipped") {
            video.currentTime = 0
            video.pause()
            console.log("📹 Video metadata loaded, frozen at start")
          }
        }}
        onError={(e) => {
          const video = e.currentTarget
          console.error("❌ Video element error:", {
            error: video.error,
            code: video.error?.code,
            message: video.error?.message,
            src: video.src,
          })
        }}
      >
        <source src={INTRO_VIDEO_URL} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Background when skipped */}
      {videoState === "skipped" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      )}

      {/* Click to Enter Overlay - Only shown when frozen */}
      {videoState === "frozen" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div
            onClick={handlePlayVideo}
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/10 transition-colors"
          >
            <div className="text-center">
              <p className="text-white text-2xl md:text-3xl font-light tracking-widest animate-pulse mb-2">
                CLICK TO ENTER
              </p>
              <p className="text-white/60 text-sm md:text-base font-light tracking-wide">
                Click anywhere to begin
              </p>
            </div>
          </div>
          
          {/* SKIP Button - Top Right */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 md:top-8 md:right-8 z-40 px-4 py-2 text-white text-xs md:text-sm font-light tracking-wide border border-white/40 bg-black/40 backdrop-blur-sm hover:bg-white hover:text-black transition-all duration-300"
          >
            SKIP
          </button>
        </div>
      )}

      {/* SKIP Button - Also shown when playing/blurring */}
      {(videoState === "playing" || videoState === "blurring") && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 md:top-8 md:right-8 z-40 px-4 py-2 text-white text-xs md:text-sm font-light tracking-wide border border-white/40 bg-black/40 backdrop-blur-sm hover:bg-white hover:text-black transition-all duration-300"
        >
          SKIP
        </button>
      )}

      {/* Main Buttons - Shown after blur transition or skip */}
      {showButtons && !showingRecentWork && (
        <div
          className="absolute inset-0 z-20 flex flex-col transition-opacity duration-500"
          style={{ opacity: buttonsOpacity }}
        >
          {/* Header Navigation */}
          <header className="absolute top-0 left-0 right-0 z-30 p-6 md:p-8 lg:p-12">
            <nav className="flex items-center justify-between">
              <div className="text-white">
                <h1 className="text-xl md:text-2xl font-light tracking-tight">{"CIRCUS17"}</h1>
              </div>
              <button className="text-white text-sm tracking-widest uppercase hover:opacity-70 transition-opacity">
                {"Menu"}
              </button>
            </nav>
          </header>

          <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-24">
            <div className="flex flex-col gap-3 w-full max-w-md ml-8">
              <button
                onClick={handleShowAllVideos}
                className="group relative px-6 py-3 text-white text-sm md:text-base font-light tracking-wide text-center border border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300"
              >
                {"ALL VIDEOS"}
              </button>
              <button
                onClick={handleRecentWorkClick}
                className="group relative px-6 py-3 text-white text-sm md:text-base font-light tracking-wide text-center border border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300"
              >
                {"RECENT WORK"}
              </button>
              <button
                onClick={() => handleCategoryClick("industry-work")}
                className="group relative px-6 py-3 text-white text-sm md:text-base font-light tracking-wide text-center border border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300"
              >
                {"Industry work"}
              </button>
              <button
                onClick={() => handleCategoryClick("music-video")}
                className="group relative px-6 py-3 text-white text-sm md:text-base font-light tracking-wide text-center border border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300"
              >
                {"MUSIC VIDEO"}
              </button>
              <button
                onClick={() => handleCategoryClick("narrative")}
                className="group relative px-6 py-3 text-white text-sm md:text-base font-light tracking-wide text-center border border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300"
              >
                {"NARRATIVE"}
              </button>
            </div>
          </div>

          <footer className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
            <div className="flex items-center justify-between text-white/50 text-xs tracking-wide">
              <span>{"© 2025 Circus17"}</span>
            </div>
          </footer>
        </div>
      )}

      {/* Video Gallery - Shown when category is selected */}
      {showingRecentWork && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-8 md:p-16 bg-black/60 backdrop-blur-sm">
          <button
            onClick={handleBackClick}
            className="absolute top-6 left-6 md:top-8 md:left-8 z-40 px-4 py-2 text-white text-xs md:text-sm font-light tracking-wide border border-white/40 bg-black/20 backdrop-blur-sm hover:bg-white hover:text-black transition-all duration-300"
          >
            {"← BACK"}
          </button>
          {videos.length === 0 ? (
            <div className="text-white text-center">
              <p className="text-lg font-light">No videos found</p>
              <p className="text-sm text-white/60 mt-2">Upload videos in the admin panel</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl w-full">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="group relative aspect-video bg-black/40 backdrop-blur-sm border border-white/20 hover:border-white/60 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs md:text-sm font-light">{video.title}</p>
                    {video.description && (
                      <p className="text-white/60 text-xs truncate">{video.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo.video_url}
          title={selectedVideo.title}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false)
            setSelectedVideo(null)
          }}
        />
      )}
    </div>
  )
}
