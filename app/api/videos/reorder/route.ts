import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const store = await cookies();
  const admin = store.get('admin')?.value;
  if (admin !== '1') {
    const err: any = new Error('NOT_ADMIN');
    err.code = 'NOT_ADMIN';
    throw err;
  }
}

// POST - Reorder videos by updating sort_order
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { videoIds } = body; // Array of video IDs in the desired order
    
    if (!Array.isArray(videoIds)) {
      return NextResponse.json(
        { error: "videoIds must be an array" },
        { status: 400 }
      );
    }
    
    // Update sort_order for each video based on its position in the array
    // Position 0 = sort_order 0, position 1 = sort_order 1, etc.
    // Use Prisma's update method - the sort_order column should exist after db push
    try {
      const updates = videoIds.map((videoId: number, index: number) => {
        return prisma.video.update({
          where: { id: videoId },
          data: { sort_order: index },
        });
      });
      
      await Promise.all(updates);
      console.log(`Successfully updated sort_order for ${videoIds.length} videos`);
      
      return NextResponse.json({ success: true });
    } catch (updateError: any) {
      const errorMsg = updateError?.message?.toLowerCase() || '';
      
      // Check if it's a schema/column issue
      if (errorMsg.includes('sort_order') || errorMsg.includes('unknown argument') || errorMsg.includes('column')) {
        console.error("sort_order column issue:", updateError?.message);
        return NextResponse.json(
          { 
            error: "sort_order column does not exist",
            details: "The sort_order column needs to be added to your database. Run: npx prisma db push",
            errorCode: "COLUMN_MISSING"
          },
          { status: 500 }
        );
      }
      
      // Re-throw to be caught by outer catch
      throw updateError;
    }
  } catch (err: any) {
    if (err?.code === 'NOT_ADMIN' || err?.message === 'NOT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error reordering videos:", err);
    console.error("Error details:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
      name: err?.name
    });
    return NextResponse.json(
      { 
        error: "Failed to reorder videos",
        details: err instanceof Error ? err.message : String(err),
        errorCode: err?.code,
        errorName: err?.name
      },
      { status: 500 }
    );
  }
}
