/**
 * Vimeo API Client
 * 
 * Server-side only module for interacting with the Vimeo API.
 * Never expose VIMEO_TOKEN to the client.
 */

export interface VimeoVideo {
  uri: string // e.g., "/videos/123456789"
  name: string // Video title
  description: string | null
  duration: number // Duration in seconds
  pictures: {
    sizes: Array<{
      width: number
      height: number
      link: string
    }>
  }
  link: string // Public Vimeo URL
  created_time: string // ISO 8601 timestamp
  modified_time: string // ISO 8601 timestamp
  stats?: {
    plays: number
  }
  embed?: {
    html: string
  }
}

export interface VimeoApiResponse {
  total: number
  page: number
  per_page: number
  paging: {
    next: string | null
    previous: string | null
    first: string | null
    last: string | null
  }
  data: VimeoVideo[]
}

/**
 * Get the Vimeo API token from environment variables
 * Throws an error if not configured
 */
function getVimeoToken(): string {
  const token = process.env.VIMEO_TOKEN
  if (!token) {
    throw new Error('VIMEO_TOKEN environment variable is not set')
  }
  return token
}

/**
 * Extract numeric Vimeo ID from URI or URL
 * Examples:
 * - "/videos/123456789" -> "123456789"
 * - "https://vimeo.com/123456789" -> "123456789"
 * - "123456789" -> "123456789"
 */
export function extractVimeoId(uriOrUrl: string): string {
  // If it's already just a number, return it
  if (/^\d+$/.test(uriOrUrl)) {
    return uriOrUrl
  }

  // Extract from URI format: /videos/123456789
  const uriMatch = uriOrUrl.match(/\/videos\/(\d+)/)
  if (uriMatch) {
    return uriMatch[1]
  }

  // Extract from URL format: https://vimeo.com/123456789
  const urlMatch = uriOrUrl.match(/vimeo\.com\/(\d+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  // Return as-is if no pattern matches
  return uriOrUrl
}

/**
 * Fetch all videos from your Vimeo account
 * Handles pagination automatically
 * 
 * @param perPage Number of videos per page (max 100, default 25)
 * @param maxPages Maximum number of pages to fetch (default: all pages)
 * @returns Array of Vimeo videos
 */
export async function fetchVimeoVideos(
  perPage: number = 25,
  maxPages: number = 10
): Promise<VimeoVideo[]> {
  const token = getVimeoToken()
  const allVideos: VimeoVideo[] = []
  let page = 1
  let hasMore = true

  while (hasMore && page <= maxPages) {
    try {
      const url = `https://api.vimeo.com/me/videos?page=${page}&per_page=${perPage}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Vimeo API error (page ${page}):`, response.status, errorText)
        
        if (response.status === 401) {
          throw new Error('Invalid Vimeo token. Please check your VIMEO_TOKEN.')
        }

        throw new Error(`Vimeo API error: ${response.status} - ${errorText}`)
      }

      const data: VimeoApiResponse = await response.json()
      
      if (data.data && data.data.length > 0) {
        allVideos.push(...data.data)
      }

      // Check if there are more pages
      hasMore = data.paging.next !== null && data.data.length === perPage
      page++

      // Safety check: if we got fewer videos than per_page, we're done
      if (data.data.length < perPage) {
        hasMore = false
      }
    } catch (error) {
      console.error(`Error fetching Vimeo videos (page ${page}):`, error)
      // If it's the first page and it fails, throw the error
      if (page === 1) {
        throw error
      }
      // Otherwise, log and break (we got some videos at least)
      console.warn(`Stopped fetching at page ${page} due to error`)
      break
    }
  }

  console.log(`Fetched ${allVideos.length} videos from Vimeo (${page - 1} page(s))`)
  return allVideos
}

/**
 * Fetch a single video by Vimeo ID
 * 
 * @param vimeoId Vimeo video ID (numeric string or URI)
 * @returns Vimeo video details or null if not found
 */
export async function fetchVimeoVideoById(vimeoId: string): Promise<VimeoVideo | null> {
  const token = getVimeoToken()
  const numericId = extractVimeoId(vimeoId)

  try {
    const url = `https://api.vimeo.com/videos/${numericId}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Vimeo video ${numericId} not found`)
        return null
      }

      const errorText = await response.text()
      console.error(`Vimeo API error for video ${numericId}:`, response.status, errorText)
      
      if (response.status === 401) {
        throw new Error('Invalid Vimeo token. Please check your VIMEO_TOKEN.')
      }

      throw new Error(`Vimeo API error: ${response.status} - ${errorText}`)
    }

    const video: VimeoVideo = await response.json()
    return video
  } catch (error) {
    console.error(`Error fetching Vimeo video ${numericId}:`, error)
    throw error
  }
}

/**
 * Get thumbnail URL for a Vimeo video
 * Returns the largest available thumbnail
 */
export function getVimeoThumbnail(video: VimeoVideo): string | null {
  if (!video.pictures || !video.pictures.sizes || video.pictures.sizes.length === 0) {
    return null
  }

  // Sort by size (width * height) and return the largest
  const sorted = [...video.pictures.sizes].sort(
    (a, b) => (b.width * b.height) - (a.width * a.height)
  )

  return sorted[0].link || null
}

/**
 * Verify Vimeo API connection
 * Returns true if connection is working, false otherwise
 */
export async function verifyVimeoConnection(): Promise<{
  success: boolean
  message: string
  videoCount?: number
}> {
  try {
    const token = getVimeoToken()
    
    // Try to fetch first page of videos
    const videos = await fetchVimeoVideos(1, 1)
    
    return {
      success: true,
      message: 'Vimeo API connection successful',
      videoCount: videos.length,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

