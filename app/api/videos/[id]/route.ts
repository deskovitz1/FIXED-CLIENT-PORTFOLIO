import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteVideo, getVideoById, updateVideo } from "@/lib/db";
import { del } from "@vercel/blob";

// Enforce Blob token is set - fail loudly if missing
const token =
  process.env.CIRCUS_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  throw new Error("Missing Blob token");
}

function requireAdmin() {
  const store = cookies();
  const admin = store.get('admin')?.value;
  if (admin !== '1') {
    const err: any = new Error('NOT_ADMIN');
    err.code = 'NOT_ADMIN';
    throw err;
  }
}

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

    console.log(`Deleting video ID ${id}: ${video.title}`);
    console.log(`Blob URL: ${video.blob_url}`);

    // Delete from Vercel Blob
    let blobDeleted = false;
    try {
      if (video.blob_url) {
        // Try multiple approaches to delete the blob
        try {
          // First, try with the full URL
          await del(video.blob_url, {
            token: token,
          });
          blobDeleted = true;
          console.log("Blob deleted successfully (using full URL)");
        } catch (urlError) {
          // If that fails, try extracting the pathname
          try {
            const urlObj = new URL(video.blob_url);
            const pathname = urlObj.pathname.substring(1); // Remove leading slash
            
            console.log(`Attempting to delete blob with pathname: ${pathname}`);
            
            await del(pathname, {
              token: token,
            });
            blobDeleted = true;
            console.log("Blob deleted successfully (using pathname)");
          } catch (pathError) {
            // If both fail, log but continue
            console.warn("Could not delete blob, but continuing with database deletion");
            console.error("URL deletion error:", urlError instanceof Error ? urlError.message : String(urlError));
            console.error("Pathname deletion error:", pathError instanceof Error ? pathError.message : String(pathError));
          }
        }
      }
    } catch (blobError) {
      console.error("Error deleting blob:", blobError);
      console.error("Blob error details:", blobError instanceof Error ? blobError.message : String(blobError));
      // Continue with database deletion even if blob deletion fails
      // The blob might not exist, might have been deleted already, or might be in a different format
      // This is not a fatal error - we still want to delete from the database
    }

    // Delete from database
    try {
      const deleted = await deleteVideo(id);

      if (!deleted) {
        console.error(`deleteVideo returned false for video ID ${id}`);
        return NextResponse.json(
          { 
            error: "Failed to delete video from database",
            details: "Database deletion returned false"
          },
          { status: 500 }
        );
      }
      
      console.log(`Video ${id} successfully deleted from database`);
    } catch (dbError: any) {
      console.error("Database deletion error:", dbError);
      console.error("Error type:", dbError?.constructor?.name);
      console.error("Error message:", dbError instanceof Error ? dbError.message : String(dbError));
      console.error("Error code:", dbError?.code);
      console.error("Error meta:", dbError?.meta);
      
      // Check if it's a "record not found" error (which is actually fine - video already deleted)
      if (dbError?.code === 'P2025' || dbError?.message?.includes('Record to delete does not exist')) {
        console.log(`Video ${id} not found in database (may have been already deleted)`);
        return NextResponse.json({ 
          success: true,
          blobDeleted,
          message: "Video not found in database (may have been already deleted)"
        });
      }
      
      return NextResponse.json(
        { 
          error: "Failed to delete video from database",
          details: dbError instanceof Error ? dbError.message : String(dbError),
          errorCode: dbError?.code,
          errorMeta: dbError?.meta
        },
        { status: 500 }
      );
    }

    console.log(`Video ${id} deleted successfully (blob: ${blobDeleted ? 'yes' : 'skipped'})`);
    return NextResponse.json({ 
      success: true,
      blobDeleted,
    });
  } catch (err: any) {
    if (err?.code === 'NOT_ADMIN' || err?.message === 'NOT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error deleting video:", err);
    console.error("Error type:", err?.constructor?.name);
    console.error("Error message:", err instanceof Error ? err.message : String(err));
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack");
    
    return NextResponse.json(
      { 
        error: "Failed to delete video",
        details: err instanceof Error ? err.message : String(err),
        errorType: err?.constructor?.name || typeof err
      },
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

// PATCH update a video
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, category, display_date, is_visible, thumbnail_url, vimeo_id, vimeo_hash } = body;

    console.log(`[PATCH /api/videos/${id}] Updating video:`, { title, description, category, display_date, is_visible, thumbnail_url, vimeo_id, vimeo_hash });

    // Build update data with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (display_date !== undefined) updateData.display_date = display_date;
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
    if (vimeo_id !== undefined) updateData.vimeo_id = vimeo_id;
    if (vimeo_hash !== undefined) updateData.vimeo_hash = vimeo_hash;

    console.log(`[PATCH /api/videos/${id}] Update data:`, updateData);

    try {
      const video = await updateVideo(id, updateData);

      if (!video) {
        console.error(`[PATCH /api/videos/${id}] Video not found for update`);
        return NextResponse.json(
          { error: "Video not found or update failed" },
          { status: 404 }
        );
      }

      console.log(`[PATCH /api/videos/${id}] Video updated successfully:`, {
        id: video.id,
        title: video.title,
        display_date: video.display_date,
        vimeo_id: video.vimeo_id,
        vimeo_hash: video.vimeo_hash,
        requested_display_date: display_date,
        requested_vimeo_id: vimeo_id,
        requested_vimeo_hash: vimeo_hash
      });
      
      // Check if display_date was requested but not saved (column might not exist)
      if (display_date !== undefined && !video.display_date && display_date !== null) {
        console.warn(`[PATCH /api/videos/${id}] WARNING: display_date was requested but not saved. Column may not exist.`);
        return NextResponse.json({ 
          video,
          warning: "Date field may not be saved. Please ensure display_date column exists in database."
        });
      }
      
      // Check if vimeo_id was requested but not saved (column might not exist)
      if (vimeo_id !== undefined && !video.vimeo_id && vimeo_id !== null) {
        console.warn(`[PATCH /api/videos/${id}] WARNING: vimeo_id was requested but not saved. Column may not exist.`);
        return NextResponse.json({
          video,
          warning: "Vimeo ID field may not be saved. Please run database migration: pnpm db:push && pnpm db:generate"
        });
      }
      
      // Check if vimeo_hash was requested but not saved (column might not exist)
      if (vimeo_hash !== undefined && !video.vimeo_hash && vimeo_hash !== null) {
        console.warn(`[PATCH /api/videos/${id}] WARNING: vimeo_hash was requested but not saved. Column may not exist.`);
        return NextResponse.json({
          video,
          warning: "Vimeo hash field may not be saved. Please run database migration: pnpm db:push && pnpm db:generate"
        });
      }
      
      return NextResponse.json({ video });
    } catch (updateError: any) {
      console.error(`[PATCH /api/videos/${id}] Update error:`, updateError);
      console.error(`[PATCH /api/videos/${id}] Error type:`, updateError?.constructor?.name);
      console.error(`[PATCH /api/videos/${id}] Error message:`, updateError instanceof Error ? updateError.message : String(updateError));
      console.error(`[PATCH /api/videos/${id}] Error code:`, updateError?.code);
      console.error(`[PATCH /api/videos/${id}] Error meta:`, updateError?.meta);
      if (updateError?.stack) {
        console.error(`[PATCH /api/videos/${id}] Error stack:`, updateError.stack);
      }
      
      // Check if error is about missing vimeo_id or vimeo_hash column
      const errorMsg = (updateError?.message || '').toLowerCase();
      if ((errorMsg.includes('vimeo_id') || errorMsg.includes('vimeo_hash')) && (errorMsg.includes('does not exist') || errorMsg.includes('column'))) {
        const missingColumn = errorMsg.includes('vimeo_hash') ? 'vimeo_hash' : 'vimeo_id';
        return NextResponse.json(
          { 
            error: "Failed to update video",
            details: `The ${missingColumn} column doesn't exist in your database. Please run: pnpm db:push && pnpm db:generate`,
            errorCode: updateError?.code,
            suggestion: `Run database migration to add ${missingColumn} column`
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update video",
          details: updateError instanceof Error ? updateError.message : String(updateError),
          errorCode: updateError?.code,
          errorMeta: updateError?.meta
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    if (err?.code === 'NOT_ADMIN' || err?.message === 'NOT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error updating video:", err);
    console.error("Error type:", err?.constructor?.name);
    console.error("Error message:", err instanceof Error ? err.message : String(err));
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack");
    
    return NextResponse.json(
      { 
        error: "Failed to update video",
        details: err instanceof Error ? err.message : String(err),
        errorType: err?.constructor?.name || typeof err
      },
      { status: 500 }
    );
  }
}

