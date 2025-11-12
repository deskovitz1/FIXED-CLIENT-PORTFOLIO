import { NextRequest, NextResponse } from "next/server";
import { deleteVideo, getVideoById } from "@/lib/db";
import { del } from "@vercel/blob";

// DELETE a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    // Get video to retrieve blob URL
    const video = await getVideoById(id);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(video.blob_url);
    } catch (blobError) {
      console.error("Error deleting blob:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    const deleted = await deleteVideo(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete video" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}

// GET a single video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

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

    return NextResponse.json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

