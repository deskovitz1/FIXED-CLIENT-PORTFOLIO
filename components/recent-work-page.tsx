"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export function RecentWorkPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasEnded, setHasEnded] = useState(false)
  const [isBlurred, setIsBlurred] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = 1.2

    const playVideo = async () => {
      try {
        await video.play()
        setTimeout(() => {
          setIsBlurred(false)
        }, 300)
      } catch (error) {
        console.error("[v0] Video autoplay failed:", error)
        setIsBlurred(false)
      }
    }

    const handleLoadedData = () => {
      video.playbackRate = 1.2
      playVideo()
    }

    const handleEnded = () => {
      setHasEnded(true)
    }

    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
          isBlurred ? "blur-md scale-105" : "blur-0 scale-100"
        }`}
        preload="auto"
        playsInline
        muted
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/FINAL%20whip%20pan-3Ch9dxgn0OWDrNLecHkmnWLdOe8oly.mp4" type="video/mp4" />
      </video>

      {hasEnded && (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/60">
          <header className="p-6 md:p-8 lg:p-12 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-white hover:opacity-70 transition-opacity">
                <h1 className="text-xl md:text-2xl font-light tracking-tight">{"CIRCUS17"}</h1>
              </Link>
              <h2 className="text-white text-lg md:text-xl font-light tracking-wide">{"RECENT WORK"}</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-video bg-white/5 border border-white/20 rounded overflow-hidden mb-3 hover:border-white/40 transition-colors">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center group-hover:border-white/60 transition-colors">
                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white/50 border-b-[6px] border-b-transparent ml-1 group-hover:border-l-white/80 transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-white text-sm font-light line-clamp-2">{"Project Title " + (i + 1)}</h3>
                    <p className="text-white/50 text-xs">{"Client Name • 2025"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
