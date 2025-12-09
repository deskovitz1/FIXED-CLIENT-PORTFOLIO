"use client"

import { useEffect, useRef, useState } from "react"

interface VimeoPlayerProps {
  /**
   * Vimeo video ID (numeric part from URL)
   * Example: For https://vimeo.com/123456789, videoId is "123456789"
   */
  videoId: string
  
  /**
   * Vimeo hash for unlisted videos (optional)
   * Example: For https://vimeo.com/123456789/ab8ee4cce4, hash is "ab8ee4cce4"
   * If provided, the player URL will include ?h={hash}
   */
  hash?: string | null
  
  /**
   * Autoplay the video when it loads
   * Note: Browser autoplay policies may prevent this
   */
  autoplay?: boolean
  
  /**
   * Start video muted (required for autoplay in most browsers)
   */
  muted?: boolean
  
  /**
   * Loop the video
   */
  loop?: boolean
  
  /**
   * Show video title overlay
   */
  title?: boolean
  
  /**
   * Show video byline (creator name)
   */
  byline?: boolean
  
  /**
   * Show video portrait (creator avatar)
   */
  portrait?: boolean
  
  /**
   * Custom CSS classes
   */
  className?: string
  
  /**
   * Aspect ratio (e.g., "16/9", "4/3")
   * Defaults to "16/9"
   */
  aspectRatio?: string
  
  /**
   * Callback when video starts playing
   */
  onPlay?: () => void
  
  /**
   * Callback when video is paused
   */
  onPause?: () => void
  
  /**
   * Callback when video ends
   */
  onEnded?: () => void
  
  /**
   * Callback when video is ready
   */
  onReady?: () => void
}

/**
 * VimeoPlayer Component
 * 
 * A reusable component that embeds a Vimeo video using an iframe.
 * Maintains the same visual appearance as native video elements.
 * 
 * Usage:
 * ```tsx
 * <VimeoPlayer 
 *   videoId="123456789" 
 *   autoplay 
 *   muted 
 *   className="w-full h-full"
 * />
 * ```
 */
export function VimeoPlayer({
  videoId,
  hash,
  autoplay = false,
  muted = false,
  loop = false,
  title = false,
  byline = false,
  portrait = false,
  className = "",
  aspectRatio = "16/9",
  onPlay,
  onPause,
  onEnded,
  onReady,
}: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)

  // Build Vimeo player URL with query parameters
  const buildVimeoUrl = () => {
    const params = new URLSearchParams({
      title: title ? "1" : "0",
      byline: byline ? "1" : "0",
      portrait: portrait ? "1" : "0",
      autoplay: autoplay ? "1" : "0",
      loop: loop ? "1" : "0",
      muted: muted ? "1" : "0",
    })

    // If hash is provided (unlisted video), add it to the URL
    if (hash && hash.trim()) {
      params.set('h', hash.trim())
    }

    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
  }

  useEffect(() => {
    // Handle iframe message events for Vimeo player callbacks
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from Vimeo
      if (!event.origin.includes('vimeo.com')) return

      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

      if (data.event === 'ready' && !isReady) {
        setIsReady(true)
        onReady?.()
      } else if (data.event === 'play') {
        onPlay?.()
      } else if (data.event === 'pause') {
        onPause?.()
      } else if (data.event === 'ended') {
        onEnded?.()
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [isReady, onPlay, onPause, onEnded, onReady])

  // Extract numeric ID from Vimeo URL if full URL is provided
  const extractVideoId = (idOrUrl: string): string => {
    // If it's already just a number, return it
    if (/^\d+$/.test(idOrUrl)) {
      return idOrUrl
    }

    // Extract ID from Vimeo URL patterns:
    // https://vimeo.com/123456789
    // https://vimeo.com/channels/staffpicks/123456789
    // https://player.vimeo.com/video/123456789
    const match = idOrUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
    return match ? match[1] : idOrUrl
  }

  const numericId = extractVideoId(videoId)
  const vimeoUrl = buildVimeoUrl()

  // Calculate aspect ratio padding
  const [width, height] = aspectRatio.split('/').map(Number)
  const paddingBottom = `${(height / width) * 100}%`

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ paddingBottom }}
    >
      <iframe
        ref={iframeRef}
        src={vimeoUrl}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={`Vimeo video ${numericId}`}
        style={{
          border: 'none',
        }}
      />
    </div>
  )
}

