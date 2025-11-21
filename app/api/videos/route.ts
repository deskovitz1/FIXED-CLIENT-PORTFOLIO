import { NextRequest, NextResponse } from "next/server";
import { getVideos, createVideo, getIntroVideo } from "@/lib/db";
import { put } from "@vercel/blob";

// GET all videos (excludes intro video by default)
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/videos - Fetching videos");
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const includeIntro = searchParams.get("includeIntro") === "true";
    
    console.log("Category filter:", category || "none");
    console.log("Include intro:", includeIntro);
    const videos = await getVideos(category || undefined, !includeIntro);
    console.log(`Found ${videos.length} video(s)`);
    return NextResponse.json({ videos });
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

// POST upload a new video
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/videos - Starting upload");
    
    const formData = await request.formData();
    const file = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;

    console.log("Received data:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      title,
      description,
      category,
    });

    if (!file) {
      console.error("No video file provided");
      return NextResponse.json(
        { error: "No video file provided" },
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

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set");
      return NextResponse.json(
        { error: "Blob storage token not configured. Please set BLOB_READ_WRITE_TOKEN in .env.local" },
        { status: 500 }
      );
    }

    console.log("Uploading to blob storage...");
    // Upload video to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });
    
    console.log("Blob uploaded:", blob.url);

    console.log("Creating video record in database...");
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

    console.log("Video created successfully:", video.id);
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
  
    const errorMessage =
      error instanceof Error ? error.message : "Unknown upload error";
  
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

