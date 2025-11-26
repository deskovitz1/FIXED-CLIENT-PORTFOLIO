import { NextResponse } from "next/server";
import { getIntroVideo } from "@/lib/db";

// GET intro video
export async function GET() {
  try {
    console.log("GET /api/intro-video - Fetching intro video");
    const introVideo = await getIntroVideo();
    
    if (!introVideo) {
      return NextResponse.json({ video: null }, { status: 200 });
    }
    
    console.log("Found intro video:", introVideo.id);
    return NextResponse.json({ video: introVideo });
  } catch (error) {
    console.error("Error fetching intro video:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch intro video",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


