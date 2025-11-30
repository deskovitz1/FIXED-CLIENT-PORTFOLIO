"use client"

import { useEffect, useState, useRef } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"
import { Play, Calendar, Bug, X, AlertCircle, Edit2, Trash2, Save, XCircle, Plus, Upload } from "lucide-react"
import { upload } from '@vercel/blob/client'

interface DebugLog {
  timestamp: string
  type: "info" | "error" | "warning" | "success"
  message: string
  data?: any
}

interface VideoHomepageProps {
  initialCategory?: string
}

interface FeaturedVideoItemProps {
  video: Video
  onChanged: () => void
  onVideoClick: () => void
  videoRefs: React.MutableRefObject<Map<number, HTMLVideoElement>>
  onVideoLoad: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  onVideoError: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  formatDate: (dateString: string) => string
}

function FeaturedVideoItem({ video, onChanged, onVideoClick, videoRefs, onVideoLoad, onVideoError, formatDate }: FeaturedVideoItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [saving, setSaving] = useState(false)
  const [showActions, setShowActions] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to save: ${err.error || err.details || res.status}`)
        return
      }

      setEditing(false)
      onChanged()
    } catch (error) {
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this video? This will remove it from the site.')) return

    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to delete: ${err.error || err.details || res.status}`)
        return
      }

      onChanged()
    } catch (error) {
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const videoUrl = video.video_url || video.blob_url

  if (editing) {
    return (
      <div className="flex-1 lg:max-w-[70%]">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-base text-gray-100 focus:outline-none focus:border-red-500"
            placeholder="Video title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 resize-none"
            rows={4}
            placeholder="Video description (optional)"
          />
          <div className="flex gap-2">
            <button
              disabled={saving}
              onClick={save}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setTitle(video.title)
                setDescription(video.description ?? '')
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded text-sm flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={remove}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 rounded text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 lg:max-w-[70%]">
      <div
        className="group cursor-pointer relative"
        onClick={onVideoClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Featured Video Thumbnail */}
        <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-black">
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
              preload="auto"
              muted
              playsInline
              onLoadedMetadata={(e) => onVideoLoad(video.id, e)}
              onError={(e) => onVideoError(video.id, e)}
              onMouseEnter={async (e) => {
                const videoEl = e.currentTarget
                if (!videoEl.isConnected) return
                
                try {
                  if (videoEl.readyState < 3) {
                    await new Promise((resolve) => {
                      const handleCanPlay = () => {
                        videoEl.removeEventListener("canplay", handleCanPlay)
                        resolve(undefined)
                      }
                      videoEl.addEventListener("canplay", handleCanPlay)
                    })
                  }
                  
                  if (videoEl.currentTime < 0.5) {
                    videoEl.currentTime = 0.5
                  }
                  
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
            <div className="w-full h-full flex items-center justify-center bg-red-900/30 border-2 border-red-500">
              <div className="text-center p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-red-300">No video URL</p>
                <p className="text-[10px] text-red-400 mt-1">
                  ID: {video.id}
                </p>
              </div>
            </div>
          )}
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-10 h-10 text-black ml-1" fill="black" />
            </div>
          </div>
          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-sm text-white">
              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>

        {/* Featured Video Info */}
        <div>
          <h2 className="font-semibold text-lg mb-2 text-gray-100 transition-colors group-hover:text-red-300">
            {video.title}
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
            {video.category && (
              <span className="px-3 py-1 rounded-full bg-red-900/50 text-red-200 border border-red-500/40">
                {video.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(video.created_at)}
            </span>
          </div>
          {video.description && (
            <p className="text-sm text-gray-300 line-clamp-3">
              {video.description}
            </p>
          )}
        </div>

        {/* Edit/Delete Actions */}
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
              }}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Edit video"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                remove()
              }}
              className="p-2 bg-red-900 hover:bg-red-800 rounded text-red-300 hover:text-red-100 transition-colors"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface VideoItemProps {
  video: Video
  onChanged: () => void
  onSelect: () => void
  videoRefs: React.MutableRefObject<Map<number, HTMLVideoElement>>
  onVideoLoad: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  onVideoError: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  formatDate: (dateString: string) => string
}

function VideoItem({ video, onChanged, onSelect, videoRefs, onVideoLoad, onVideoError, formatDate }: VideoItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [saving, setSaving] = useState(false)
  const [showActions, setShowActions] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to save: ${err.error || err.details || res.status}`)
        return
      }

      setEditing(false)
      onChanged()
    } catch (error) {
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this video? This will remove it from the site.')) return

    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to delete: ${err.error || err.details || res.status}`)
        return
      }

      onChanged()
    } catch (error) {
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const videoUrl = video.video_url || video.blob_url

  if (editing) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
          placeholder="Video title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 resize-none"
          rows={3}
          placeholder="Video description (optional)"
        />
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={save}
            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs flex items-center justify-center gap-1"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            disabled={saving}
            onClick={() => {
              setEditing(false)
              setTitle(video.title)
              setDescription(video.description ?? '')
            }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded text-xs flex items-center justify-center gap-1"
          >
            <XCircle className="w-3 h-3" />
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={remove}
            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 rounded text-xs flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group cursor-pointer flex gap-3 relative"
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Sidebar Video Thumbnail */}
      <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black">
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
            preload="auto"
            muted
            playsInline
            onLoadedMetadata={(e) => onVideoLoad(video.id, e)}
            onError={(e) => onVideoError(video.id, e)}
            onMouseEnter={async (e) => {
              const videoEl = e.currentTarget
              if (!videoEl.isConnected) return
              
              try {
                if (videoEl.readyState < 3) {
                  await new Promise((resolve) => {
                    const handleCanPlay = () => {
                      videoEl.removeEventListener("canplay", handleCanPlay)
                      resolve(undefined)
                    }
                    videoEl.addEventListener("canplay", handleCanPlay)
                  })
                }
                
                if (videoEl.currentTime < 0.5) {
                  videoEl.currentTime = 0.5
                }
                
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
          <div className="w-full h-full flex items-center justify-center bg-red-900/30">
            <AlertCircle className="w-4 h-4 text-red-400" />
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
        <h3 className="font-medium text-sm line-clamp-2 mb-1 text-gray-100 group-hover:text-red-300 transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-1.5">
            {video.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {video.category && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/50 text-red-200 border border-red-500/40">
              {video.category}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(video.created_at)}
          </span>
        </div>
      </div>

      {/* Edit/Delete Actions */}
      {showActions && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
            title="Edit video"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              remove()
            }}
            className="p-1.5 bg-red-900 hover:bg-red-800 rounded text-red-300 hover:text-red-100 transition-colors"
            title="Delete video"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function VideoHomepage({ initialCategory }: VideoHomepageProps = {}) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null)
  const [showDebug, setShowDebug] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null) // MB/s
  const [uploadLoaded, setUploadLoaded] = useState(0) // bytes loaded
  const [uploadTotal, setUploadTotal] = useState(0) // total bytes
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const addVideoFormRef = useRef<HTMLFormElement | null>(null)
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null)
  const uploadStartTimeRef = useRef<number | null>(null)
  const uploadAbortControllerRef = useRef<AbortController | null>(null)

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
    addDebugLog("info", "Component mounted, fetching videos...", { initialCategory })
    // Fetch videos with initial category if provided
    if (initialCategory) {
      setSelectedCategory(initialCategory)
      fetchVideos(initialCategory)
    } else {
      fetchVideos()
    }
  }, [initialCategory])

  const fetchVideos = async (category?: string) => {
    try {
      setLoading(true)
      addDebugLog("info", "Fetching videos...", { category: category || "all" })
      const url = category 
        ? `/api/videos?category=${encodeURIComponent(category)}`
        : "/api/videos"
      
      // Disable caching to always get fresh data (visibility changes should be immediate)
      const response = await fetch(url, { cache: 'no-store' })
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
      let loadedVideos = data.videos || []
      
      // TEMPORARILY DISABLED: Show all videos while we fix visibility
      // TODO: Re-enable after migration: loadedVideos = loadedVideos.filter((v: Video) => v.visible === true)
      
      addDebugLog("success", `Loaded ${loadedVideos.length} videos (after filtering hidden)`, {
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

  const handleVideoChanged = () => {
    // Refetch videos after edit/delete
    if (selectedCategory) {
      fetchVideos(selectedCategory)
    } else {
      fetchVideos()
    }
  }

  const handleAddVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const fileInput = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!fileInput || !title) {
      alert('Please select a video file and enter a title')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadSpeed(null)
    setUploadLoaded(0)
    setUploadTotal(fileInput.size)
    uploadStartTimeRef.current = performance.now()

    // Create abort controller for cancellation
    const abortController = new AbortController()
    uploadAbortControllerRef.current = abortController

    try {
      // Step 1: Upload file directly to Vercel Blob (client-side)
      console.log('📤 Starting client-side blob upload...')
      
      const blob = await upload(fileInput.name, fileInput, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        multipart: true, // Important for large files
        onUploadProgress: (progress) => {
          // Update progress from the blob upload
          const percentComplete = Math.min((progress.loaded / progress.total) * 100, 95)
          
          // Calculate MB/s
          if (uploadStartTimeRef.current !== null) {
            const elapsedSec = (performance.now() - uploadStartTimeRef.current) / 1000
            const mbUploaded = progress.loaded / (1024 * 1024)
            const mbPerSec = elapsedSec > 0 ? mbUploaded / elapsedSec : 0
            
            setUploadProgress(percentComplete)
            setUploadSpeed(mbPerSec)
            setUploadLoaded(progress.loaded)
            setUploadTotal(progress.total)
          }
        },
      })

      console.log('✅ Blob upload completed:', blob.url)
      setUploadProgress(95)

      // Step 2: Save video metadata to database
      const response = await fetch('/api/videos/create-from-blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl: blob.url,
          blobPath: blob.pathname,
          title,
          description: description || null,
          category: category || null,
          file_name: fileInput.name,
          file_size: fileInput.size,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || error.details || 'Failed to save video')
      }

      setUploadProgress(100)
      setUploadSpeed(null) // Clear speed when complete
      
      // Reset form before closing modal (use ref for reliability)
      if (addVideoFormRef.current) {
        try {
          addVideoFormRef.current.reset()
        } catch (resetError) {
          console.warn('Could not reset form:', resetError)
        }
      }
      
      // Close modal and refresh video list
      setShowAddVideo(false)
      handleVideoChanged() // Refresh video list
      
      setTimeout(() => {
        setUploadProgress(0)
        setUploadSpeed(null)
        setUploadLoaded(0)
        setUploadTotal(0)
        uploadStartTimeRef.current = null
      }, 1000)
    } catch (error) {
      // Don't show alert if upload was cancelled
      if (error instanceof Error && (error.message === 'Upload cancelled' || error.name === 'AbortError')) {
        console.log('Upload cancelled by user')
      } else {
        console.error('Error adding video:', error)
        alert(`Failed to add video: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Don't close modal on error so user can retry
      }
    } finally {
      setUploading(false)
      uploadAbortControllerRef.current = null
      uploadStartTimeRef.current = null
    }
  }

  const handleCancelUpload = () => {
    // Cancel the upload using abort controller
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort()
      uploadAbortControllerRef.current = null
    }
    setUploading(false)
    setUploadProgress(0)
    setUploadSpeed(null)
    setUploadLoaded(0)
    setUploadTotal(0)
    uploadStartTimeRef.current = null
    setShowAddVideo(false)
    // Reset form
    if (addVideoFormRef.current) {
      try {
        addVideoFormRef.current.reset()
      } catch (resetError) {
        console.warn('Could not reset form:', resetError)
      }
    }
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
    <div className="min-h-screen text-gray-100 relative bg-[#05060A]">
      {/* Debug Panel Toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-full shadow-lg flex items-center gap-2 text-sm text-white"
      >
        <Bug className="w-4 h-4" />
        Debug
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-black/95 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="font-bold text-sm flex items-center gap-2 text-gray-100">
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
      <header className="sticky top-0 z-50 border-b border-red-900/60 bg-black/80 backdrop-blur-sm px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-xl font-bold text-gray-100 hover:opacity-70 transition-opacity"
            >
              CIRCUS17
            </a>
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="/videos"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === null
                    ? "bg-red-600 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                All
              </a>
              <a
                href="/videos?category=recent-work"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "recent-work"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                Recent Work
              </a>
              <a
                href="/videos?category=music-video"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "music-video"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                Music
              </a>
              <a
                href="/videos?category=industry-work"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "industry-work"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                Launch Videos
              </a>
              <a
                href="/videos?category=clothing"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "clothing"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                Clothing
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddVideo(true)}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Video
            </button>
            <a
              href="/admin"
              className="px-4 py-2 text-sm text-gray-900 rounded-full transition-colors hover:bg-red-200"
              style={{ backgroundColor: '#FBBF24' }}
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Add Video Dialog */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Add New Video
              </h2>
              <button
                onClick={() => {
                  setShowAddVideo(false)
                  setUploadProgress(0)
                }}
                className="text-gray-400 hover:text-white"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={addVideoFormRef} onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Video File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="file"
                  accept="video/*"
                  required
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Enter video description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
                >
                  <option value="">None</option>
                  <option value="recent-work">Recent Work</option>
                  <option value="music-video">Music</option>
                  <option value="industry-work">Launch Videos</option>
                  <option value="clothing">Clothing</option>
                  <option value="narrative">Narrative</option>
                </select>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                    <span>Uploading... {uploadProgress.toFixed(1)}%</span>
                    {uploadSpeed !== null && (
                      <span className="font-mono">{uploadSpeed.toFixed(2)} MB/s</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadTotal > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {((uploadLoaded / (1024 * 1024))).toFixed(2)} MB / {((uploadTotal / (1024 * 1024))).toFixed(2)} MB
                      </span>
                      {uploadProgress < 95 && (
                        <span>Uploading to server...</span>
                      )}
                      {uploadProgress >= 95 && (
                        <span>Processing...</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm transition-colors"
                >
                  {uploading ? 'Cancel Upload' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Video
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <p className="text-xl text-gray-300 mb-2">No videos found</p>
              <p className="text-sm text-gray-400">
                {selectedCategory 
                  ? `No videos in "${selectedCategory}" category`
                  : "Upload videos in the admin panel"}
              </p>
              <a
                href="/admin"
                className="inline-block mt-4 px-4 py-2 text-sm text-gray-900 rounded-full transition-colors hover:bg-yellow-300"
                style={{ backgroundColor: '#FBBF24' }}
              >
                Go to Admin
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Featured Video (Left Side - Larger) */}
            {featuredVideo && (
              <FeaturedVideoItem
                video={featuredVideo}
                onChanged={handleVideoChanged}
                onVideoClick={() => handleVideoClick(featuredVideo)}
                videoRefs={videoRefs}
                onVideoLoad={handleVideoLoad}
                onVideoError={handleVideoError}
                formatDate={formatDate}
              />
            )}

            {/* Sidebar Videos (Right Side - Smaller, Vertical) */}
            <div className="lg:w-[30%] space-y-3">
              {videos
                .filter((video) => video.id !== featuredVideo?.id)
                .map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onChanged={handleVideoChanged}
                    onSelect={() => {
                      setFeaturedVideo(video)
                      handleVideoClick(video)
                    }}
                    videoRefs={videoRefs}
                    onVideoLoad={handleVideoLoad}
                    onVideoError={handleVideoError}
                    formatDate={formatDate}
                  />
                ))}
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
