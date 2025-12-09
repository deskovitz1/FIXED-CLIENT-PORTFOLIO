/**
 * Parse a Vimeo URL to extract video ID and hash
 * 
 * Supports formats:
 * - https://vimeo.com/123456789 (public video)
 * - https://vimeo.com/123456789/ab8ee4cce4 (unlisted video with hash)
 * - https://player.vimeo.com/video/123456789
 * - 123456789 (just the ID)
 * 
 * @param urlOrId - Vimeo URL or just the video ID
 * @returns Object with videoId and hash (hash may be null for public videos)
 */
export function parseVimeoUrl(urlOrId: string): { videoId: string | null; hash: string | null } {
  if (!urlOrId || !urlOrId.trim()) {
    return { videoId: null, hash: null }
  }

  const trimmed = urlOrId.trim()

  // If it's just a number, it's the video ID
  if (/^\d+$/.test(trimmed)) {
    return { videoId: trimmed, hash: null }
  }

  // Try to match Vimeo URL patterns
  // Pattern 1: https://vimeo.com/manage/videos/123456789/ab8ee4cce4 (manage page, unlisted with hash)
  const manageUnlistedMatch = trimmed.match(/vimeo\.com\/manage\/videos\/(\d+)\/([a-f0-9]+)/i)
  if (manageUnlistedMatch) {
    return {
      videoId: manageUnlistedMatch[1],
      hash: manageUnlistedMatch[2]
    }
  }

  // Pattern 2: https://vimeo.com/manage/videos/123456789 (manage page, public)
  const managePublicMatch = trimmed.match(/vimeo\.com\/manage\/videos\/(\d+)/i)
  if (managePublicMatch) {
    return {
      videoId: managePublicMatch[1],
      hash: null
    }
  }

  // Pattern 3: https://vimeo.com/123456789/ab8ee4cce4 (unlisted with hash)
  const unlistedMatch = trimmed.match(/vimeo\.com\/(\d+)\/([a-f0-9]+)/i)
  if (unlistedMatch) {
    return {
      videoId: unlistedMatch[1],
      hash: unlistedMatch[2]
    }
  }

  // Pattern 4: https://vimeo.com/123456789 (public)
  // Pattern 5: https://player.vimeo.com/video/123456789
  const publicMatch = trimmed.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (publicMatch) {
    return {
      videoId: publicMatch[1],
      hash: null
    }
  }

  // If no match, return null
  return { videoId: null, hash: null }
}

