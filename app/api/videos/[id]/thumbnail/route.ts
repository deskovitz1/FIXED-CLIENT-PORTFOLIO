import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { updateVideo } from "@/lib/db";

async function requireAdmin() {
  const store = await cookies();
  const admin = store.get('admin')?.value;
  if (admin !== '1') {
    const err: any = new Error('NOT_ADMIN');
    err.code = 'NOT_ADMIN';
    throw err;
  }
}

// POST - Upload thumbnail for a video
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    // Enforce Blob token is set - fail loudly if missing (check at runtime, not build time)
    const token =
      process.env.CIRCUS_READ_WRITE_TOKEN ||
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing Blob token - please configure BLOB_READ_WRITE_TOKEN environment variable' },
        { status: 500 }
      );
    }
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log(`Uploading thumbnail for video ID ${id}:`, file.name, "Size:", file.size);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob
    const blob = await put(`thumbnails/${id}-${Date.now()}-${file.name}`, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
      token: token,
    });

    console.log("Thumbnail uploaded successfully:", blob.url);

    // Update video record with thumbnail URL
    const updatedVideo = await updateVideo(id, { thumbnail_url: blob.url });

    if (!updatedVideo) {
      return NextResponse.json(
        { error: "Video not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      thumbnailUrl: blob.url,
      video: updatedVideo
    });
  } catch (err: any) {
    if (err?.code === 'NOT_ADMIN' || err?.message === 'NOT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error uploading thumbnail:", err);
    return NextResponse.json(
      { 
        error: "Failed to upload thumbnail",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}



