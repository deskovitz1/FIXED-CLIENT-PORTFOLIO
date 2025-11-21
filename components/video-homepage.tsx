"use client"

import { useEffect, useState, useRef } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"
import { Play, Calendar, Bug, X, AlertCircle } from "lucide-react"

interface DebugLog {
  timestamp: string
  type: "info" | "error" | "warning" | "success"
  message: string
  data?: any
}

export function VideoHomepage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())

  const addDebugLog = (type: DebugLog["type"], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    }
    setDebugLogs((prev) => [...prev.slice(-49), log]) // Keep last 50 logs
    console.log(`[${type.toUpperCase()}] ${message}`, data || "")
  }

  useEffect(() => {
    addDebugLog("info", "Component mounted, fetching videos...")
    // Skip intro/menu logic - go straight to video grid
    fetchVideos()
  }, [])

  const fetchVideos = async (category?: string) => {
    try {
      setLoading(true)
      addDebugLog("info", "Fetching videos...", { category: category || "all" })
      const url = category 
        ? `/api/videos?category=${encodeURIComponent(category)}`
        : "/api/videos"
      
      const response = await fetch(url)
      addDebugLog("info", "API response received", { 
        status: response.status, 
        ok: response.ok 
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        addDebugLog("error", "API request failed", { 
          status: response.status, 
          error: errorText 
        })
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const loadedVideos = data.videos || []
      addDebugLog("success", `Loaded ${loadedVideos.length} videos`, {
        videos: loadedVideos.map((v: Video) => ({
          id: v.id,
          title: v.title,
          blob_url: v.blob_url?.substring(0, 50) + "...",
          video_url: v.video_url?.substring(0, 50) + "...",
        }))
      })
      setVideos(loadedVideos)
      // Set first video as featured (always update when videos change)
      if (loadedVideos.length > 0) {
        setFeaturedVideo(loadedVideos[0])
      } else {
        setFeaturedVideo(null)
      }
    } catch (error) {
      addDebugLog("error", "Error fetching videos", { error })
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category: string) => {
    addDebugLog("info", "Category clicked", { category })
    setSelectedCategory(category)
    fetchVideos(category)
  }

  const handleAllVideosClick = () => {
    addDebugLog("info", "All videos clicked")
    setSelectedCategory(null)
    fetchVideos()
  }

  const handleVideoClick = async (video: Video) => {
    const videoUrl = video.video_url || video.blob_url
    
    console.log("Selected video:", video)
    console.log("Video URL for modal:", videoUrl)
    
    addDebugLog("info", "Video clicked", { 
      id: video.id, 
      title: video.title,
      video_url: video.video_url,
      blob_url: video.blob_url,
      final_url: videoUrl
    })
    
    // Pause any hover previews first
    videoRefs.current.forEach((videoEl) => {
      if (videoEl && !videoEl.paused) {
        try {
          videoEl.pause()
          videoEl.currentTime = 0
        } catch (error) {
          // Ignore pause errors
        }
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setSelectedVideo(video)
    setIsPlayerOpen(true)
  }

  const handleVideoLoad = (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    addDebugLog("success", `Video ${videoId} loaded`, {
      readyState: video.readyState,
      networkState: video.networkState,
      duration: video.duration,
      src: video.src.substring(0, 50) + "...",
    })
  }

  const handleVideoError = (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    addDebugLog("error", `Video ${videoId} error`, {
      error: video.error,
      code: video.error?.code,
      message: video.error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)))

  // Show video grid directly (skip intro/menu logic)
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white relative">
      {/* Debug Panel Toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center gap-2 text-sm"
      >
        <Bug className="w-4 h-4" />
        Debug
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-black/95 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Debug Monitor
            </h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              debugLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border-l-2 ${
                    log.type === "error"
                      ? "bg-red-900/20 border-red-500 text-red-300"
                      : log.type === "warning"
                      ? "bg-yellow-900/20 border-yellow-500 text-yellow-300"
                      : log.type === "success"
                      ? "bg-green-900/20 border-green-500 text-green-300"
                      : "bg-gray-900/20 border-gray-500 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-[10px]">{log.timestamp}</span>
                    <span className="font-bold uppercase text-[10px]">{log.type}</span>
                  </div>
                  <div className="text-xs">{log.message}</div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-400 text-[10px]">
                        Details
                      </summary>
                      <pre className="mt-1 text-[10px] overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-700 flex gap-2">
            <button
              onClick={() => setDebugLogs([])}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Clear
            </button>
            <div className="flex-1 text-xs text-gray-400 flex items-center justify-end">
              {debugLogs.length} logs
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#272727] px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-xl font-bold hover:opacity-70 transition-opacity"
            >
              CIRCUS17
            </a>
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={handleAllVideosClick}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === null
                    ? "bg-white text-black"
                    : "hover:bg-[#272727]"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat || "")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === cat
                      ? "bg-white text-black"
                      : "hover:bg-[#272727]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
          <a
            href="/admin"
            className="px-4 py-2 text-sm bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors"
          >
            Admin
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">🎪</div>
              <p className="text-gray-400">Loading videos...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-xl text-gray-400 mb-2">No videos found</p>
              <p className="text-sm text-gray-500">
                {selectedCategory 
                  ? `No videos in "${selectedCategory}" category`
                  : "Upload videos in the admin panel"}
              </p>
              <a
                href="/admin"
                className="inline-block mt-4 px-4 py-2 text-sm bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors"
              >
                Go to Admin
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Featured Video (Left Side - Larger) */}
            {featuredVideo && (
              <div className="flex-1 lg:max-w-[70%]">
                <div
                  className="group cursor-pointer"
                  onClick={() => handleVideoClick(featuredVideo)}
                >
                  {/* Featured Video Thumbnail */}
                  <div className="relative aspect-video bg-[#181818] rounded-lg overflow-hidden mb-4">
                    {(() => {
                      const videoUrl = featuredVideo.video_url || featuredVideo.blob_url
                      return videoUrl ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              videoRefs.current.set(featuredVideo.id, el)
                            } else {
                              videoRefs.current.delete(featuredVideo.id)
                            }
                          }}
                          src={videoUrl}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                          onLoadedMetadata={(e) => handleVideoLoad(featuredVideo.id, e)}
                          onLoadedData={(e) => {
                            addDebugLog("success", `Video ${featuredVideo.id} data loaded`, {
                              readyState: e.currentTarget.readyState,
                            })
                          }}
                          onCanPlay={(e) => {
                            addDebugLog("success", `Video ${featuredVideo.id} can play`, {
                              readyState: e.currentTarget.readyState,
                              duration: e.currentTarget.duration,
                            })
                          }}
                          onError={(e) => handleVideoError(featuredVideo.id, e)}
                          onMouseEnter={async (e) => {
                            const videoEl = e.currentTarget
                            if (!videoEl.isConnected) return
                            
                            try {
                              videoEl.currentTime = 1
                              await videoEl.play()
                              addDebugLog("success", `Video ${featuredVideo.id} hover preview playing`)
                            } catch (error: any) {
                              if (error.name !== "AbortError") {
                                addDebugLog("warning", `Video ${featuredVideo.id} hover preview failed`, {
                                  error: error.message,
                                  name: error.name,
                                })
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            const videoEl = e.currentTarget
                            if (!videoEl.isConnected) return
                            
                            requestAnimationFrame(() => {
                              if (videoEl.isConnected) {
                                try {
                                  videoEl.pause()
                                  videoEl.currentTime = 0
                                } catch (error) {
                                  // Silently handle pause errors
                                }
                              }
                            })
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-red-900/20 border-2 border-red-500">
                          <div className="text-center p-4">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-red-400">No video URL</p>
                            <p className="text-[10px] text-red-500 mt-1">
                              ID: {featuredVideo.id}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-10 h-10 text-black ml-1" fill="black" />
                      </div>
                    </div>
                    {/* Duration Badge */}
                    {featuredVideo.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-sm">
                        {Math.floor(featuredVideo.duration / 60)}:{(featuredVideo.duration % 60).toString().padStart(2, "0")}
                      </div>
                    )}
                  </div>

                  {/* Featured Video Info */}
                  <div>
                    <h2 className="font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors">
                      {featuredVideo.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                      {featuredVideo.category && (
                        <span className="px-3 py-1 bg-[#272727] rounded-full">
                          {featuredVideo.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(featuredVideo.created_at)}
                      </span>
                    </div>
                    {featuredVideo.description && (
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {featuredVideo.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Videos (Right Side - Smaller, Vertical) */}
            <div className="lg:w-[30%] space-y-3">
              {videos
                .filter((video) => video.id !== featuredVideo?.id)
                .map((video) => {
                  const videoUrl = video.video_url || video.blob_url

                  return (
                    <div
                      key={video.id}
                      className="group cursor-pointer flex gap-3"
                      onClick={() => {
                        setFeaturedVideo(video)
                        handleVideoClick(video)
                      }}
                    >
                      {/* Sidebar Video Thumbnail */}
                      <div className="relative w-40 h-24 flex-shrink-0 bg-[#181818] rounded-lg overflow-hidden">
                        {videoUrl ? (
                          <video
                            ref={(el) => {
                              if (el) {
                                videoRefs.current.set(video.id, el)
                              } else {
                                videoRefs.current.delete(video.id)
                              }
                            }}
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                            playsInline
                            onLoadedMetadata={(e) => handleVideoLoad(video.id, e)}
                            onError={(e) => handleVideoError(video.id, e)}
                            onMouseEnter={async (e) => {
                              const videoEl = e.currentTarget
                              if (!videoEl.isConnected) return
                              
                              try {
                                videoEl.currentTime = 1
                                await videoEl.play()
                              } catch (error: any) {
                                // Silently handle AbortError
                              }
                            }}
                            onMouseLeave={(e) => {
                              const videoEl = e.currentTarget
                              if (!videoEl.isConnected) return
                              
                              requestAnimationFrame(() => {
                                if (videoEl.isConnected) {
                                  try {
                                    videoEl.pause()
                                    videoEl.currentTime = 0
                                  } catch (error) {
                                    // Silently handle pause errors
                                  }
                                }
                              })
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-red-900/20">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Play className="w-6 h-6 text-white" fill="white" />
                        </div>
                        {/* Duration Badge */}
                        {video.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px]">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                          </div>
                        )}
                      </div>

                      {/* Sidebar Video Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {video.category && (
                            <span className="px-1.5 py-0.5 bg-[#272727] rounded text-[10px]">
                              {video.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(video.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
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
