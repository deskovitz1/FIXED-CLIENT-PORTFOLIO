import { NextRequest, NextResponse } from "next/server";
import { getVideos, createVideo } from "@/lib/db";
import { put } from "@vercel/blob";

// GET all videos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    
    const videos = await getVideos(category || undefined);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

// POST upload a new video
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Upload video to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      contentType: file.type,
    });

    // Create video record in database
    const video = await createVideo({
      title,
      description: description || undefined,
      category: category || undefined,
      video_url: blob.url,
      blob_url: blob.url,
      file_name: file.name,
      file_size: file.size,
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}

