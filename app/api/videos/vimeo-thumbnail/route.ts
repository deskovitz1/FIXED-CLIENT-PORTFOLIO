import { NextRequest, NextResponse } from "next/server"
import { fetchVimeoVideoById, getVimeoThumbnail, extractVimeoId } from "@/lib/vimeo"

/**
 * GET /api/videos/vimeo-thumbnail?vimeoId=123456789
 * 
 * Fetches thumbnail URL from Vimeo for a given Vimeo video ID.
 * Returns the thumbnail URL or null if not found.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vimeoId = searchParams.get("vimeoId")

    if (!vimeoId) {
      return NextResponse.json(
        { error: "vimeoId query parameter is required" },
        { status: 400 }
      )
    }

    // Extract numeric Vimeo ID
    const numericId = extractVimeoId(vimeoId)

    // Fetch video details from Vimeo
    const video = await fetchVimeoVideoById(numericId)

    if (!video) {
      return NextResponse.json(
        { thumbnail_url: null, error: "Video not found" },
        { status: 404 }
      )
    }

    // Extract thumbnail URL
    const thumbnailUrl = getVimeoThumbnail(video)

    if (!thumbnailUrl) {
      return NextResponse.json(
        { thumbnail_url: null, error: "No thumbnail available" },
        { status: 404 }
      )
    }

    return NextResponse.json({ thumbnail_url: thumbnailUrl })
  } catch (error) {
    console.error("Error fetching Vimeo thumbnail:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch thumbnail",
        thumbnail_url: null,
      },
      { status: 500 }
    )
  }
}

