"use client"

import { useEffect, useRef, useState } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"

const INTRO_VIDEO_URL = "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/A_cinematic__Blender_style_animated_sequence_inside_a_handcrafted_miniature_world__The_scene_begins_%25204K.mp4"

export function VideoHomepage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoState, setVideoState] = useState<"frozen" | "playing" | "blurring" | "ended">("frozen")
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
    if (!video) return

    // Set video source
    video.src = INTRO_VIDEO_URL
    video.load()

    const handleLoadedMetadata = () => {
      // Freeze on first frame
      video.currentTime = 0
      video.pause()
      setIsLoaded(true)
      console.log("✅ Video loaded, frozen on first frame", {
        duration: video.duration,
        readyState: video.readyState,
        networkState: video.networkState,
      })
    }

    const handleLoadedData = () => {
      console.log("✅ Video data loaded", {
        duration: video.duration,
        readyState: video.readyState,
      })
    }

    const handleCanPlay = () => {
      console.log("✅ Video can play")
    }

    const handleTimeUpdate = () => {
      if (videoState !== "playing") return

      // Detect when door opens - adjust this time based on your video
      // You may need to fine-tune this value by watching the video
      const doorOpenTime = 8 // seconds - adjust this to match when door opens in your video
      
      if (video.currentTime >= doorOpenTime && videoState === "playing") {
        // Start blurring transition
        setVideoState("blurring")
        startBlurTransition()
      }
    }

    const handlePlay = () => {
      console.log("▶️ Video started playing")
    }

    const handlePause = () => {
      console.log("⏸️ Video paused")
    }

    const handleError = (e: Event) => {
      const video = e.target as HTMLVideoElement
      console.error("❌ Video error:", {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src,
      })
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
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

  const handlePlayVideo = async () => {
    const video = videoRef.current
    if (!video) {
      console.error("❌ Video ref is null")
      return
    }

    if (videoState !== "frozen") {
      console.log("⚠️ Video not in frozen state, current state:", videoState)
      return
    }

    console.log("🎬 Attempting to play video...", {
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
      currentTime: video.currentTime,
      duration: video.duration,
    })

    try {
      // Ensure video is at the start
      if (video.currentTime !== 0) {
        video.currentTime = 0
      }

      // Wait for video to be ready if needed
      if (video.readyState < 2) {
        console.log("⏳ Waiting for video to be ready...")
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"))
          }, 10000)
          
          const onCanPlay = () => {
            clearTimeout(timeout)
            video.removeEventListener("canplay", onCanPlay)
            video.removeEventListener("error", onError)
            resolve(undefined)
          }
          
          const onError = () => {
            clearTimeout(timeout)
            video.removeEventListener("canplay", onCanPlay)
            video.removeEventListener("error", onError)
            reject(new Error("Video load error"))
          }
          
          video.addEventListener("canplay", onCanPlay, { once: true })
          video.addEventListener("error", onError, { once: true })
        })
      }

      setVideoState("playing")
      await video.play()
      console.log("✅ Video play() succeeded")
    } catch (error) {
      console.error("❌ Video playback failed:", error)
      console.error("Video error details:", {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        networkState: video.networkState,
        readyState: video.readyState,
      })
      setVideoState("frozen")
    }
  }

  const fetchVideos = async (category?: string) => {
    try {
      const url = category 
        ? `/api/videos?category=${encodeURIComponent(category)}`
        : "/api/videos"
      const response = await fetch(url)
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
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

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
    setIsPlayerOpen(true)
  }

  const handleBackClick = () => {
    setShowingRecentWork(false)
    setSelectedCategory(null)
    setVideos([])
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
        style={{
          filter: `blur(${blurAmount}px)`,
          transform: blurAmount > 0 ? "scale(1.05)" : "scale(1)",
        }}
        preload="auto"
        playsInline
        muted
        onLoadedMetadata={() => {
          const video = videoRef.current
          if (video) {
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
            networkState: video.networkState,
            readyState: video.readyState,
            src: video.src,
          })
        }}
      >
        <source src={INTRO_VIDEO_URL} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Click to Enter Overlay - Only shown when frozen */}
      {videoState === "frozen" && (
        <div
          onClick={handlePlayVideo}
          className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/10 transition-colors"
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
      )}

      {/* Main Buttons - Shown after blur transition */}
      {videoState === "ended" && !showingRecentWork && (
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
