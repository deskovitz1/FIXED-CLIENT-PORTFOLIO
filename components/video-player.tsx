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
  const [isReady, setIsReady] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (isOpen && mountedRef.current) {
      // Wait a bit for the player to mount before trying to play
      const timer = setTimeout(() => {
        if (mountedRef.current && isReady) {
          setIsPlaying(true)
        }
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setIsPlaying(false)
    }
  }, [isOpen, isReady])

  const handleReady = () => {
    if (mountedRef.current) {
      setIsReady(true)
      // Start playing after a short delay to ensure player is ready
      setTimeout(() => {
        if (mountedRef.current) {
          setIsPlaying(true)
        }
      }, 200)
    }
  }

  const handleError = (error: any) => {
    console.error("Video playback error:", error)
    // Don't try to play if there's an error
    setIsPlaying(false)
  }

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
            onReady={handleReady}
            onError={handleError}
            config={{
              file: {
                attributes: {
                  controlsList: "nodownload",
                  preload: "auto",
                },
                forceVideo: true,
              },
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

