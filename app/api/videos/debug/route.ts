import { NextRequest, NextResponse } from "next/server";
import { getVideoById, getVideos } from "@/lib/db";

/**
 * Debug endpoint to inspect video records
 * GET /api/videos/debug?id=39 - Get specific video
 * GET /api/videos/debug - Get first video
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("id");

    if (videoId) {
      const id = parseInt(videoId, 10);
      if (isNaN(id)) {
        return NextResponse.json(
          { error: "Invalid video ID" },
          { status: 400 }
        );
      }

      const video = await getVideoById(id);
      if (!video) {
        return NextResponse.json(
          { error: "Video not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        video,
        debug: {
          hasVimeoId: !!video.vimeo_id,
          vimeoIdValue: video.vimeo_id,
          vimeoIdType: typeof video.vimeo_id,
        },
      });
    } else {
      // Get first video
      const videos = await getVideos(undefined, false);
      const firstVideo = videos[0];

      if (!firstVideo) {
        return NextResponse.json({ error: "No videos found" }, { status: 404 });
      }

      return NextResponse.json({
        video: firstVideo,
        debug: {
          hasVimeoId: !!firstVideo.vimeo_id,
          vimeoIdValue: firstVideo.vimeo_id,
          vimeoIdType: typeof firstVideo.vimeo_id,
        },
        totalVideos: videos.length,
      });
    }
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch video",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

