import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createVideo } from "@/lib/db";

function requireAdmin() {
  const store = cookies();
  const admin = store.get('admin')?.value;
  if (admin !== '1') {
    const err: any = new Error('NOT_ADMIN');
    err.code = 'NOT_ADMIN';
    throw err;
  }
}

// POST - Save video metadata after client-side Blob upload
// The file is already uploaded directly to Blob storage by the client
export async function POST(request: NextRequest) {
  const saveStartTime = Date.now();
  
  try {
    requireAdmin();
    const body = await request.json();
    const { 
      blobUrl, 
      blobPath,
      title, 
      description, 
      category, 
      display_date,
      file_name,
      file_size,
      vimeo_id,
      vimeo_hash
    } = body;

    console.log("\n💾 [SAVE METADATA] " + "=".repeat(60));
    console.log(`   Title: ${title}`);
    console.log(`   File: ${file_name || "unknown"}`);
    console.log(`   Category: ${category || "none"}`);
    console.log(`   Vimeo ID: ${vimeo_id || "none"}`);
    console.log(`   Vimeo Hash: ${vimeo_hash || "none"}`);
    console.log(`   Blob URL: ${blobUrl?.substring(0, 60) || "none"}...`);

    if (!title) {
      console.error("❌ No title provided");
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Require either blobUrl OR vimeo_id
    if (!blobUrl && !vimeo_id) {
      console.error("❌ No blob URL or Vimeo ID provided");
      return NextResponse.json(
        { error: "Either a video file (blob URL) or Vimeo ID is required" },
        { status: 400 }
      );
    }

    console.log("   ⏳ Creating video record in database...");
    // Create video record in database
    // If using Vimeo, blob_url and video_url are optional (will use placeholder)
    const video = await createVideo({
      title,
      description: description || undefined,
      category: category || undefined,
      video_url: blobUrl || undefined, // Optional if using Vimeo
      blob_url: blobUrl || undefined, // Optional if using Vimeo
      file_name: file_name || (vimeo_id ? `vimeo-${vimeo_id}` : "uploaded-video"),
      file_size: file_size || null,
      display_date: display_date || undefined,
      vimeo_id: vimeo_id || undefined,
      vimeo_hash: vimeo_hash || undefined,
    });

    const saveTime = (Date.now() - saveStartTime) / 1000;
    console.log(`   ✓ Video saved successfully!`);
    console.log(`   📊 Video ID: ${video.id}`);
    console.log(`   ⏱️  Save time: ${saveTime.toFixed(2)}s`);
    console.log("💾 [SAVE METADATA END] " + "=".repeat(60) + "\n");

    return NextResponse.json({ video }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'NOT_ADMIN' || err?.message === 'NOT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const saveTime = (Date.now() - saveStartTime) / 1000;
    console.error("\n❌ [SAVE METADATA ERROR] " + "=".repeat(60));
    console.error(`   Failed after: ${saveTime.toFixed(2)}s`);
    console.error(`   Error type:`, err?.constructor?.name);
    console.error(`   Error message:`, err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      console.error(`   Stack:`, err.stack);
    }
    console.error("❌ [SAVE METADATA ERROR END] " + "=".repeat(60) + "\n");
  
    // Check if error is about missing vimeo_id column
    const errorMsg = (err?.message || '').toLowerCase();
    if (errorMsg.includes('vimeo_id') && (errorMsg.includes('does not exist') || errorMsg.includes('column'))) {
      return NextResponse.json(
        { 
          error: "Database migration required",
          details: "The vimeo_id column doesn't exist in your database. Please run: pnpm db:push && pnpm db:generate",
          suggestion: "Run database migration to add vimeo_id column"
        },
        { status: 500 }
      );
    }
  
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

