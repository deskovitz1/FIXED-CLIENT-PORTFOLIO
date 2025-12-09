import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Video } from '@/lib/db'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get thumbnail URL for a video, falling back to Vimeo if available
 * This function constructs the Vimeo thumbnail URL directly using a public pattern
 * to avoid unnecessary API calls.
 * 
 * @param video Video object with thumbnail_url and optionally vimeo_id
 * @returns Thumbnail URL string or null
 */
export function getVideoThumbnail(video: Video | null | undefined): string | null {
  if (!video) return null

  // If video has a thumbnail URL, use it
  if (video.thumbnail_url) {
    return video.thumbnail_url
  }

  // If no thumbnail but has Vimeo ID, construct Vimeo thumbnail URL
  if (video.vimeo_id) {
    // Extract numeric Vimeo ID (handle different formats)
    const vimeoIdMatch = video.vimeo_id.match(/\d+/)
    const numericId = vimeoIdMatch ? vimeoIdMatch[0] : video.vimeo_id
    
    // Use Vimeo's public thumbnail URL pattern
    // Format: https://i.vimeocdn.com/video/{id}_[width]x[height].jpg
    // We'll request a standard size (640x360 is common)
    // Note: This is a best-effort approach; actual thumbnail may vary
    return `https://vumbnail.com/${numericId}.jpg`
  }

  return null
}
