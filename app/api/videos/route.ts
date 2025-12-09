import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getVideos, createVideo, getIntroVideo } from "@/lib/db";

function requireAdmin() {
  const store = cookies();
  const admin = store.get('admin')?.value;
  if (admin !== '1') {
    const err: any = new Error('NOT_ADMIN');
    err.code = 'NOT_ADMIN';
    throw err;
  }
}

// GET all videos (excludes intro video by default)
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/videos - Fetching videos");
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const includeIntro = searchParams.get("includeIntro") === "true";
    
    console.log("Category filter:", category || "none");
    console.log("Include intro:", includeIntro);
    const allVideos = await getVideos(category || undefined, !includeIntro);
    
    console.log(`getVideos returned ${allVideos.length} video(s)`);
    
    // Log vimeo_id for debugging
    console.log("Videos with vimeo_id:", allVideos.map(v => ({ id: v.id, title: v.title, vimeo_id: v.vimeo_id })));
    
    // BANDWIDTH-SAFE: Add aggressive caching headers for video metadata
    // Video URLs in response are immutable Blob URLs, safe to cache for 1 year
    // BUT: Disable caching when vimeo_id is being updated frequently during development
    const response = NextResponse.json({ videos: allVideos });
    // Temporarily disable caching to ensure fresh data during vimeo_id migration
    // TODO: Re-enable caching after migration is complete
    // response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error("Error fetching videos:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Failed to fetch videos",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Save video metadata after direct upload to Blob
// The file is already uploaded directly to Blob storage by the client
export async function POST(request: NextRequest) {
  try {
    requireAdmin();
    console.log("POST /api/videos - Saving video metadata");
    
    const body = await request.json();
    const { 
      blobUrl, 
      pathname,
      title, 
      description, 
      category, 
      display_date,
      file_name,
      file_size 
    } = body;

    if (!blobUrl) {
      console.error("No blob URL provided");
      return NextResponse.json(
        { error: "Blob URL is required" },
        { status: 400 }
      );
    }

    if (!title) {
      console.error("No title provided");
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    console.log("Creating video record in database...");
    // Create video record in database
    const video = await createVideo({
      title,
      description: description || undefined,
      category: category || undefined,
      video_url: blobUrl,
      blob_url: blobUrl,
      file_name: file_name || "uploaded-video",
      file_size: file_size || null,
      display_date: display_date || undefined,
    });

    console.log("Video created successfully:", video.id);
    return NextResponse.json({ video }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'NOT_ADMIN' || err?.message === 'NOT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error saving video:", err);
    console.error("Error type:", err?.constructor?.name);
    console.error("Error message:", err instanceof Error ? err.message : String(err));
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack");
  
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";
  
    return NextResponse.json(
      { 
        error: errorMessage,
        details: err instanceof Error ? err.stack : String(err),
        errorType: err?.constructor?.name || typeof err
      },
      { status: 500 }
    );
  }
}

