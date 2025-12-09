import { NextRequest, NextResponse } from 'next/server'
import { fetchVimeoVideos, fetchVimeoVideoById, extractVimeoId } from '@/lib/vimeo'

/**
 * Vimeo API Route
 * 
 * Fetches videos from your Vimeo account using the Vimeo API.
 * Requires VIMEO_TOKEN environment variable to be set.
 * 
 * GET /api/vimeo - Get all videos (with pagination support)
 * GET /api/vimeo?id=123456789 - Get a specific video by ID
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - per_page: Videos per page (default: 25, max: 100)
 * - id: Specific video ID to fetch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get('id')

    // If specific video ID requested
    if (videoId) {
      const video = await fetchVimeoVideoById(videoId)
      
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ video })
    }

    // Otherwise, fetch all videos with pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || '25', 10),
      100 // Max per Vimeo API
    )

    const videos = await fetchVimeoVideos(perPage, page)

    return NextResponse.json({
      videos,
      total: videos.length,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error('Error in Vimeo API route:', error)
    
    if (error instanceof Error && error.message.includes('VIMEO_TOKEN')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch videos from Vimeo',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

