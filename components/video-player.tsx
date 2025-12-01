"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Video } from "@/lib/db"
import { useIsMobile } from "@/hooks/use-mobile"

interface VideoPlayerProps {
  video?: Video
  videoUrl?: string
  title?: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ video, videoUrl, title, isOpen, onClose }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useIsMobile()
  
  // Get URL using the same logic as the hover preview
  // If video object is passed, use video.video_url || video.blob_url
  // If only videoUrl string is passed, use that
  const url = video 
    ? (video.video_url || video.blob_url || "")
    : (videoUrl || "")

  if (!isOpen) return null

  if (!url) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative w-full max-w-7xl aspect-video bg-black flex items-center justify-center">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="text-red-500 p-4 text-center">
            <p className="text-lg mb-2">No video URL available for this video.</p>
            {video && (
              <p className="text-sm text-gray-600">
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
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4">
      <div className={`relative w-full ${isMobile ? 'h-full' : 'max-w-7xl aspect-video'} bg-black flex flex-col`}>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-50 text-white hover:bg-white/10 min-h-[44px] min-w-[44px]`}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        
        <video
          src={url}
          poster={video?.thumbnail_url || undefined}
          controls
          autoPlay
          muted
          playsInline
          preload="auto"
          className={`w-full ${isMobile ? 'h-full flex-1' : 'h-full'}`}
          style={{ width: "100%", height: isMobile ? "100%" : "100%", objectFit: "contain" }}
          onLoadStart={() => {
            setIsLoading(true)
            // Start loading immediately when modal opens
            const videoEl = document.querySelector('video[src="' + url + '"]') as HTMLVideoElement
            if (videoEl && videoEl.readyState < 2) {
              videoEl.load()
            }
          }}
          onWaiting={() => {
            setIsLoading(true)
            console.log("Video waiting for data in modal", { url })
          }}
          onCanPlay={() => {
            setIsLoading(false)
            console.log("Video can play in modal", { url })
          }}
          onPlaying={() => setIsLoading(false)}
          onCanPlayThrough={() => {
            console.log("Video fully buffered in modal", { url })
          }}
          onPlay={() => {
            console.log("Video started playing in modal", { url })
          }}
          onError={(e) => {
            setIsLoading(false)
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
        />
        
        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {title && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <h3 className="text-gray-100 text-lg font-light drop-shadow-md">{title}</h3>
          </div>
        )}
      </div>
    </div>
  )
}
