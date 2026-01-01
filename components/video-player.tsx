"use client"

import { useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Video } from "@/lib/db"
import { useIsMobile } from "@/hooks/use-mobile"
import { VimeoPlayer } from "@/components/VimeoPlayer"
import { getVideoThumbnail } from "@/lib/utils"

interface VideoPlayerProps {
  video?: Video
  videoUrl?: string
  title?: string
  isOpen: boolean
  onClose: () => void
  allVideos?: Video[]
  currentVideoIndex?: number
  onNextVideo?: () => void
  onPrevVideo?: () => void
}

export function VideoPlayer({ 
  video, 
  videoUrl, 
  title, 
  isOpen, 
  onClose,
  allVideos = [],
  currentVideoIndex = 0,
  onNextVideo,
  onPrevVideo
}: VideoPlayerProps) {
  const isMobile = useIsMobile()
  
  // Get Vimeo ID - Vimeo only playback
  const vimeoId = video?.vimeo_id || null
  
  // Debug logging
  useEffect(() => {
    if (isOpen && video) {
      console.log('[VideoPlayer] Video opened:', {
        id: video.id,
        title: video.title,
        vimeo_id: video.vimeo_id,
        vimeoId: vimeoId,
      })
    }
  }, [isOpen, video?.id, vimeoId])

  const canGoPrev = currentVideoIndex > 0 && onPrevVideo
  const canGoNext = currentVideoIndex < allVideos.length - 1 && onNextVideo

  if (!isOpen) return null

  // If video has Vimeo ID, use Vimeo Player
  if (vimeoId) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        {/* Navigation Arrows */}
        {canGoPrev && (
          <button
            onClick={onPrevVideo}
            className={`absolute ${isMobile ? 'left-2' : 'left-4'} z-40 p-3 bg-black/60 hover:bg-black/80 active:bg-black/90 rounded-full text-white transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center`}
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
        
        {canGoNext && (
          <button
            onClick={onNextVideo}
            className={`absolute ${isMobile ? 'right-2' : 'right-4'} z-40 p-3 bg-black/60 hover:bg-black/80 active:bg-black/90 rounded-full text-white transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center`}
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        <div className={`relative ${isMobile ? 'w-full h-full' : 'w-[90vw] max-w-[1400px] h-[85vh] max-h-[800px]'} bg-black flex flex-col ${isMobile ? '' : 'rounded-lg'} overflow-hidden`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} z-50 p-2.5 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation`}
          >
            <X className="h-6 w-6 sm:h-6 sm:w-6" />
          </button>
          
          {/* Vimeo Player */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            <div className="w-full h-full max-w-full max-h-full">
              <VimeoPlayer
                videoId={vimeoId}
                hash={video?.vimeo_hash || null}
                autoplay
                muted={false}
                loop={false}
                className="w-full h-full"
                aspectRatio="16/9"
              />
            </div>
            
            {/* Title Overlay */}
            {(title || video?.title) && (
              <div className={`absolute ${isMobile ? 'top-3 left-3 right-16' : 'top-4 left-4 right-20'} transition-opacity duration-300 z-20`}>
                <h3 className={`text-white ${isMobile ? 'text-sm sm:text-base' : 'text-lg'} font-semibold drop-shadow-lg`}>{title || video?.title}</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No Vimeo ID - show error message
  if (!vimeoId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative w-[95vw] h-[95vh] max-w-none bg-black flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="text-red-500 p-4 text-center max-w-md">
            <p className="text-lg mb-2">No video available for this video.</p>
            {video && (
              <div className="text-sm text-gray-400 mt-2 space-y-1">
                <p>Video ID: {video.id}</p>
                {!video.vimeo_id && (
                  <p className="mt-2">
                    This video doesn't have a Vimeo ID set.
                    <br />
                    Please add a Vimeo ID in the admin panel.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

}
