"use client"

import { useEffect, useState } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"
import { Play, Clock, Calendar } from "lucide-react"

export function VideoHomepage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async (category?: string) => {
    try {
      setLoading(true)
      const url = category 
        ? `/api/videos?category=${encodeURIComponent(category)}`
        : "/api/videos"
      const response = await fetch(url)
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
    setIsPlayerOpen(true)
  }

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    fetchVideos(category || undefined)
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

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#272727] px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">CIRCUS17</h1>
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={() => handleCategoryChange(null)}
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
                  onClick={() => handleCategoryChange(cat || null)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-[#181818] rounded-lg overflow-hidden mb-3">
                  <video
                    src={video.blob_url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    onMouseEnter={(e) => {
                      const video = e.currentTarget
                      video.currentTime = 1
                      video.play().catch(() => {})
                    }}
                    onMouseLeave={(e) => {
                      const video = e.currentTarget
                      video.pause()
                      video.currentTime = 0
                    }}
                  />
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-black ml-1" fill="black" />
                    </div>
                  </div>
                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {video.category && (
                        <span className="px-2 py-0.5 bg-[#272727] rounded-full">
                          {video.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(video.created_at)}
                      </span>
                    </div>
                    {video.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    {video.file_size && (
                      <p className="text-xs text-gray-600 mt-1">
                        {formatFileSize(video.file_size)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo.video_url || selectedVideo.blob_url}
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
