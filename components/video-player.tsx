"use client"

import { useEffect, useRef, useState } from "react"
import ReactPlayer from "react-player"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  videoUrl: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ videoUrl, title, isOpen, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [isOpen])

  if (!isOpen) return null

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
        
        <div className="w-full h-full">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            controls
            width="100%"
            height="100%"
            config={{
              file: {
                attributes: {
                  controlsList: "nodownload",
                },
                forceVideo: true,
              },
            }}
            onError={(error) => {
              console.error("Video playback error:", error)
            }}
          />
        </div>
        
        {title && (
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-lg font-light">{title}</h3>
          </div>
        )}
      </div>
    </div>
  )
}

