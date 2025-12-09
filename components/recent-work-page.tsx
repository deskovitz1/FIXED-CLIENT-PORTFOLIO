"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { VimeoPlayer } from "@/components/VimeoPlayer"

// TODO: Replace this hardcoded Vimeo ID with the actual Vimeo ID for the "FINAL whip pan" video
// Extract the numeric ID from your Vimeo URL (e.g., if URL is https://vimeo.com/123456789, use "123456789")
const RECENT_WORK_VIMEO_ID = "REPLACE_WITH_ACTUAL_VIMEO_ID"

export function RecentWorkPage() {
  const [hasEnded, setHasEnded] = useState(false)
  const [isBlurred, setIsBlurred] = useState(true)

  // Note: Vimeo iframe doesn't support playbackRate, so we'll remove that functionality
  // The blur effect will be removed after a short delay instead
  useEffect(() => {
    setTimeout(() => {
      setIsBlurred(false)
    }, 300)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Vimeo Player - replaces native video element */}
      <div className={`absolute inset-0 h-full w-full transition-all duration-1000 ${
        isBlurred ? "blur-md scale-105" : "blur-0 scale-100"
      }`}>
        {RECENT_WORK_VIMEO_ID !== "REPLACE_WITH_ACTUAL_VIMEO_ID" ? (
          <VimeoPlayer
            videoId={RECENT_WORK_VIMEO_ID}
            autoplay
            muted
            loop={false}
            className="w-full h-full"
            aspectRatio="16/9"
            onEnded={() => setHasEnded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/50">
            <p className="text-white">Please set RECENT_WORK_VIMEO_ID in recent-work-page.tsx</p>
          </div>
        )}
      </div>

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
