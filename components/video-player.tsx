"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Video } from "@/lib/db"

interface VideoPlayerProps {
  video?: Video
  videoUrl?: string
  title?: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ video, videoUrl, title, isOpen, onClose }: VideoPlayerProps) {
  // Get URL using the same logic as the hover preview
  // If video object is passed, use video.video_url || video.blob_url
  // If only videoUrl string is passed, use that
  const url = video 
    ? (video.video_url || video.blob_url || "")
    : (videoUrl || "")

  if (!isOpen) return null

  if (!url) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        <div className="relative w-full max-w-7xl aspect-video bg-black flex items-center justify-center">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="text-red-500 p-4 text-center">
            <p className="text-lg mb-2">No video URL available for this video.</p>
            {video && (
              <p className="text-sm text-gray-400">
                video.video_url: {video.video_url || "null"}
                <br />
                video.blob_url: {video.blob_url || "null"}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-7xl aspect-video bg-black">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="w-full h-full"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            const video = e.currentTarget
            console.error("Video playback error:", {
              error: video.error,
              code: video.error?.code,
              message: video.error?.message,
              networkState: video.networkState,
              readyState: video.readyState,
              src: video.src,
            })
          }}
          onLoadedMetadata={() => {
            console.log("Video metadata loaded in modal", { url })
          }}
          onCanPlay={() => {
            console.log("Video can play in modal", { url })
          }}
          onPlay={() => {
            console.log("Video started playing in modal", { url })
          }}
        />
        
        {title && (
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-lg font-light">{title}</h3>
          </div>
        )}
      </div>
    </div>
  )
}
