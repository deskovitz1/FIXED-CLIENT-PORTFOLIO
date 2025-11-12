"use client"

import { useEffect, useRef, useState } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"

export function VideoHomepage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const splashVideoRef = useRef<HTMLVideoElement>(null)
  const hoverVideoRef = useRef<HTMLVideoElement>(null)
  const transitionVideoRef = useRef<HTMLVideoElement>(null)
  const [videoState, setVideoState] = useState<"initial" | "playing" | "ended">("initial")
  const [isLoaded, setIsLoaded] = useState(false)
  const [splashComplete, setSplashComplete] = useState(false)
  const [showingRecentWork, setShowingRecentWork] = useState(false)
  const [recentWorkEnded, setRecentWorkEnded] = useState(false)
  const [isReversing, setIsReversing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHoveringEnterSign, setIsHoveringEnterSign] = useState(false)
  const [isCinematicTransition, setIsCinematicTransition] = useState(false)
  const [transitionBlur, setTransitionBlur] = useState(16)
  const [buttonsOpacity, setButtonsOpacity] = useState(1)
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.load()

    const handleLoadedData = () => {
      setIsLoaded(true)
    }

    const handleEnded = () => {
      if (showingRecentWork) {
        setRecentWorkEnded(true)
      } else {
        setVideoState("ended")
      }
    }

    const handleTimeUpdate = () => {
      if (isReversing && video.currentTime <= 3) {
        video.pause()
        setIsReversing(false)
        setShowingRecentWork(false)
        setRecentWorkEnded(false)
        video.src = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/smaller%20intro%20video-5p1JPBX2ybN86Pz32yeNEcsN7C7hA8.mp4"
        video.load()
        video.addEventListener(
          "loadeddata",
          () => {
            video.currentTime = video.duration
            setVideoState("ended")
          },
          { once: true },
        )
        return
      }

      if (showingRecentWork && !isReversing && video.duration - video.currentTime <= 3) {
        video.pause()
        setRecentWorkEnded(true)
      }
    }

    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("timeupdate", handleTimeUpdate)

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [showingRecentWork, isReversing])

  useEffect(() => {
    const splashVideo = splashVideoRef.current
    if (!splashVideo) return

    const handleSplashLoadedMetadata = () => {
      splashVideo.currentTime = 1
    }

    const handleSplashTimeUpdate = () => {
      if (splashVideo.duration - splashVideo.currentTime <= 2) {
        setSplashComplete(true)
      }
    }

    const handleSplashEnded = () => {
      setSplashComplete(true)
    }

    splashVideo.addEventListener("loadedmetadata", handleSplashLoadedMetadata)
    splashVideo.addEventListener("timeupdate", handleSplashTimeUpdate)
    splashVideo.addEventListener("ended", handleSplashEnded)

    return () => {
      splashVideo.removeEventListener("loadedmetadata", handleSplashLoadedMetadata)
      splashVideo.removeEventListener("timeupdate", handleSplashTimeUpdate)
      splashVideo.removeEventListener("ended", handleSplashEnded)
    }
  }, [])

  useEffect(() => {
    const hoverVideo = hoverVideoRef.current
    if (!hoverVideo) return

    if (isHoveringEnterSign) {
      hoverVideo.currentTime = 0
      hoverVideo.play().catch((error) => {
        console.error("Hover video playback failed:", error)
      })
    } else {
      hoverVideo.pause()
      hoverVideo.currentTime = 0
    }
  }, [isHoveringEnterSign])

  useEffect(() => {
    const transitionVideo = transitionVideoRef.current
    if (!transitionVideo) return

    const handleTransitionTimeUpdate = () => {
      if (!isCinematicTransition) return

      const progress = transitionVideo.currentTime / transitionVideo.duration

      // Gradually reduce blur from 16px to 0 over the video duration
      setTransitionBlur(16 * (1 - progress))

      // Fade out buttons in the first 30% of the video
      if (progress < 0.3) {
        setButtonsOpacity(1 - progress / 0.3)
      } else {
        setButtonsOpacity(0)
      }
    }

    const handleTransitionEnded = () => {
      setIsCinematicTransition(false)
      setShowingRecentWork(true)
      setRecentWorkEnded(true)
    }

    transitionVideo.addEventListener("timeupdate", handleTransitionTimeUpdate)
    transitionVideo.addEventListener("ended", handleTransitionEnded)

    return () => {
      transitionVideo.removeEventListener("timeupdate", handleTransitionTimeUpdate)
      transitionVideo.removeEventListener("ended", handleTransitionEnded)
    }
  }, [isCinematicTransition])

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
    const transitionVideo = transitionVideoRef.current
    if (!transitionVideo || isTransitioning) return

    setIsTransitioning(true)
    setIsCinematicTransition(true)
    setTransitionBlur(16)
    setButtonsOpacity(1)
    setSelectedCategory("recent-work")

    // Fetch videos for recent-work category
    await fetchVideos("recent-work")

    try {
      transitionVideo.currentTime = 0
      transitionVideo.playbackRate = 1.0
      await transitionVideo.play()
      setIsTransitioning(false)
    } catch (error) {
      console.error("Transition video playback failed:", error)
      setIsTransitioning(false)
      setIsCinematicTransition(false)
    }
  }

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category)
    await fetchVideos(category)
    setRecentWorkEnded(true)
    setShowingRecentWork(true)
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
    setIsPlayerOpen(true)
  }

  const handleBackClick = () => {
    const video = videoRef.current
    if (!video) return

    setRecentWorkEnded(false)
    setIsReversing(true)
    video.playbackRate = -2.0
    video.play().catch((error) => {
      console.error("Reverse playback failed:", error)
    })
  }

  const handlePlayVideo = async () => {
    const video = videoRef.current
    if (!video || videoState !== "initial") return

    try {
      video.playbackRate = 1.2
      setVideoState("playing")
      await video.play()
    } catch (error) {
      console.error("Video playback failed:", error)
      setVideoState("initial")
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
        style={{
          filter: videoState === "ended" && !showingRecentWork && !isCinematicTransition ? "blur(16px)" : "none",
          transform:
            videoState === "ended" && !showingRecentWork && !isCinematicTransition ? "scale(1.05)" : "scale(1)",
          opacity: (isHoveringEnterSign && videoState === "initial") || isCinematicTransition ? 0 : 1,
        }}
        preload="auto"
        playsInline
        muted
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/smaller%20intro%20video-5p1JPBX2ybN86Pz32yeNEcsN7C7hA8.mp4" type="video/mp4" />
      </video>

      <video
        ref={transitionVideoRef}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        style={{
          opacity: isCinematicTransition ? 1 : 0,
          filter: `blur(${transitionBlur}px)`,
          pointerEvents: isCinematicTransition ? "none" : "none",
        }}
        preload="auto"
        playsInline
        muted
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/FINAL%20whip%20pan-1ZTIjwXgQZdV2mD5L0rA8eo5zdzPHb.mp4" type="video/mp4" />
      </video>

      <video
        ref={hoverVideoRef}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        style={{
          opacity: isHoveringEnterSign && videoState === "initial" ? 1 : 0,
          pointerEvents: "none",
        }}
        loop
        muted
        playsInline
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ENTER%20SIGN-LwiMWSKi0848Vup44dcGPeAK8TuimZ.mp4" type="video/mp4" />
      </video>

      {videoState === "initial" && splashComplete && (
        <>
          {/* Click to enter overlay */}
          <div
            onClick={handlePlayVideo}
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          >
            <div className="text-white text-center">
              <p className="text-lg md:text-xl font-light tracking-widest animate-pulse">{"CLICK TO ENTER"}</p>
            </div>
          </div>

          {/* Hover zone for enter sign flicker - bottom right quadrant */}
          <div
            className="absolute bottom-0 right-0 w-1/2 h-1/2 z-10"
            onMouseEnter={() => setIsHoveringEnterSign(true)}
            onMouseLeave={() => setIsHoveringEnterSign(false)}
          />
        </>
      )}

      {recentWorkEnded && !isCinematicTransition && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-8 md:p-16">
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

      {videoState === "ended" && !showingRecentWork && (
        <div
          className="absolute inset-0 z-20 flex flex-col transition-opacity duration-500"
          style={{ opacity: isCinematicTransition ? buttonsOpacity : 1 }}
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
                disabled={isTransitioning}
                className="group relative px-6 py-3 text-white text-sm md:text-base font-light tracking-wide text-center border border-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {videoState === "ended" && !showingRecentWork && (
        <div
          className="absolute inset-0 bg-black/40 z-10 transition-opacity duration-500"
          style={{ opacity: isCinematicTransition ? buttonsOpacity * 0.4 : 0.4 }}
        />
      )}

      {!splashComplete && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
          <video ref={splashVideoRef} autoPlay muted playsInline className="w-48 h-48 md:w-64 md:h-64 object-contain">
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mp4%20circus%20logo-LA8G5Bg1Im4bgoFJZTNjVxzpUfI6SM.mp4" type="video/mp4" />
          </video>
        </div>
      )}

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
