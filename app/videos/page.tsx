"use client"

import { VideoHomepage } from "@/components/video-homepage"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

/**
 * BANDWIDTH AUDIT SUMMARY - Video Loading Behavior
 * 
 * This page uses VideoHomepage component which implements bandwidth-safe video loading:
 * 
 * WHERE VIDEOS ARE LOADED:
 * 1. Featured video (top): Uses preload="none", loads only when user clicks
 * 2. Grid videos: Use preload="none", loads only when user clicks
 * 3. Video player modal: Uses preload="none", loads when modal opens
 * 
 * WHEN BLOB VIDEO IS FETCHED:
 * - Videos are NEVER auto-loaded or preloaded
 * - Videos load ONLY when user explicitly clicks to play
 * - Thumbnails (small images) are used for all previews
 * - No video bytes downloaded until play() is called
 * 
 * NORMAL PAGE VISIT + ONE VIDEO PLAY:
 * - Downloads: Small thumbnail images (~100-500KB each)
 * - Downloads: ONE full video file (50-500MB) ONLY when user clicks play
 * - Total: ~1-10MB thumbnails + 1 video file
 * 
 * BANDWIDTH SAFETY FEATURES:
 * - All <video> elements use preload="none"
 * - Thumbnails used instead of video previews
 * - No aggressive preloading or background loading
 * - API responses cached for 1 year (immutable Blob URLs)
 * - Videos load only on explicit user interaction
 */
function VideosPageContent() {
  const searchParams = useSearchParams()
  const category = searchParams?.get('category') || undefined

  return (
    <VideoHomepage initialCategory={category} />
  )
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VideosPageContent />
    </Suspense>
  )
}
