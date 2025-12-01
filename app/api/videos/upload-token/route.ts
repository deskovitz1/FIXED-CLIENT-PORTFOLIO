import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Enforce Blob token is set - fail loudly if missing
const token =
  process.env.CIRCUS_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  throw new Error("Missing Blob token");
}

// POST - Upload file directly to Blob (server-side)
// This route handles the file upload server-side to avoid client-side limitations
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    console.log("Uploading file to Blob:", filename, "Size:", file.size);

    // Token is already validated at module level

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type || "video/mp4",
      addRandomSuffix: true,
      token: token,
    });

    console.log("File uploaded successfully:", blob.url);

    return NextResponse.json({ 
      blobUrl: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    console.error("Error details:", error instanceof Error ? error.stack : String(error));
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET handler removed - use POST with FormData instead

