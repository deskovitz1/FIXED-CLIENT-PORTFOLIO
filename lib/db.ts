import { prisma } from "@/lib/prisma";

export interface Video {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  blob_url: string;
  file_name: string;
  file_size: number | null;
  duration: number | null;
  display_date: string | null;
  is_visible: boolean | null;
  created_at: string;
  updated_at: string;
}

// Intro video filtering configuration
// NOTE: This is used to EXCLUDE the intro video from the regular video grid listings
// The actual intro video URL is configured in app/config/intro.ts
// 
// To update: Change the filename pattern below to match your intro video's filename
// This helps filter it out from the /videos page grid
const INTRO_VIDEO_FILENAME = "WEBSITE VID heaven"

export async function getVideos(category?: string, excludeIntro: boolean = true): Promise<Video[]> {
  try {
    const whereClause: any = {}
    
    // Build conditions array
    const conditions: any[] = []
    
  if (category) {
      conditions.push({ category })
    }
    
    // Exclude intro video from regular listings (by filename)
    // The intro video is configured in app/config/intro.ts
    // We filter it out here so it doesn't appear in the /videos grid
    if (excludeIntro) {
      conditions.push({
        NOT: {
          file_name: {
            contains: INTRO_VIDEO_FILENAME,
          },
        },
      })
    }
    
    // Only use AND if we have multiple conditions
    if (conditions.length > 1) {
      whereClause.AND = conditions
    } else if (conditions.length === 1) {
      Object.assign(whereClause, conditions[0])
    }
    
    // Order by created_at for now (display_date ordering will be enabled after database migration)
    // TODO: Once display_date column exists in database, enable ordering by display_date for "recent-work"
    const orderBy = { created_at: "desc" as const };
    
    let videos;
    try {
      videos = await prisma.video.findMany({
        where: whereClause,
        orderBy,
      });
    } catch (error) {
      // If there's a schema mismatch, try a simpler query
      console.error("Error in findMany, trying raw query:", error);
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (errorMsg.includes("column") || errorMsg.includes("does not exist")) {
        // Use raw SQL query as fallback
        const whereSql = category 
          ? `WHERE category = '${category.replace(/'/g, "''")}'`
          : excludeIntro 
          ? `WHERE file_name NOT LIKE '%${INTRO_VIDEO_FILENAME.replace(/'/g, "''")}%'`
          : "";
        videos = await prisma.$queryRawUnsafe<Array<any>>(
          `SELECT * FROM videos ${whereSql} ORDER BY created_at DESC LIMIT 100`
        );
      } else {
        throw error;
      }
    }
    
    return videos.map((v: any) => ({
      ...v,
      file_size: v.file_size ? Number(v.file_size) : null,
      display_date: v.display_date ? v.display_date.toISOString() : null,
      is_visible: v.is_visible !== null && v.is_visible !== undefined ? Boolean(v.is_visible) : true, // Default to visible
      created_at: v.created_at ? (typeof v.created_at === 'string' ? v.created_at : v.created_at.toISOString()) : new Date().toISOString(),
      updated_at: v.updated_at ? (typeof v.updated_at === 'string' ? v.updated_at : v.updated_at.toISOString()) : new Date().toISOString(),
    })) as Video[];
  } catch (error) {
    console.error("Error in getVideos:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    
    // If there's a database error, return empty array instead of throwing
    // This prevents the entire API from failing
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("column") || errorMsg.includes("unknown") || errorMsg.includes("does not exist")) {
        console.warn("Database schema issue detected, returning empty array");
        return [];
      }
    }
    
    throw error;
  }
}

export async function getIntroVideo(): Promise<Video | null> {
  try {
    const video = await prisma.video.findFirst({
      where: {
        file_name: {
          contains: INTRO_VIDEO_FILENAME,
        },
      },
    });
    
    if (!video) return null
    
    return {
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? video.display_date.toISOString() : null,
      created_at: video.created_at.toISOString(),
      updated_at: video.updated_at.toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error in getIntroVideo:", error);
    return null;
  }
}

export async function getVideoById(id: number): Promise<Video | null> {
  try {
    let video;
    try {
      video = await prisma.video.findUnique({
        where: { id },
      });
    } catch (error) {
      // If there's a schema mismatch (e.g., display_date column doesn't exist), use raw query
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (errorMsg.includes("column") || errorMsg.includes("does not exist")) {
        console.warn("Schema mismatch detected in getVideoById, using raw query");
        const results = await prisma.$queryRaw<Array<any>>`
          SELECT * FROM videos WHERE id = ${id} LIMIT 1
        `;
        video = results[0] || null;
      } else {
        throw error;
      }
    }
    
    if (!video) return null;
    
    return {
      ...video,
      file_size: video.file_size ? Number(video.file_size) : null,
      display_date: video.display_date ? (typeof video.display_date === 'string' ? video.display_date : video.display_date.toISOString()) : null,
      is_visible: video.is_visible !== null && video.is_visible !== undefined ? Boolean(video.is_visible) : true,
      created_at: video.created_at ? (typeof video.created_at === 'string' ? video.created_at : video.created_at.toISOString()) : new Date().toISOString(),
      updated_at: video.updated_at ? (typeof video.updated_at === 'string' ? video.updated_at : video.updated_at.toISOString()) : new Date().toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error in getVideoById:", error);
    throw error;
  }
}

export async function createVideo(data: {
  title: string;
  description?: string;
  category?: string;
  video_url: string;
  thumbnail_url?: string;
  blob_url: string;
  file_name: string;
  file_size?: number;
  duration?: number;
  display_date?: string;
}): Promise<Video> {
  try {
    console.log(`[createVideo] Creating video:`, { title: data.title, file_name: data.file_name });
    
    // Use raw SQL directly - more reliable and avoids Prisma schema issues
    const columns: string[] = ['title', 'description', 'category', 'video_url', 'thumbnail_url', 'blob_url', 'file_name', 'file_size', 'duration', 'created_at', 'updated_at'];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build INSERT query with only basic fields that should always exist
    values.push(data.title); // $1
    values.push(data.description || null); // $2
    values.push(data.category || null); // $3
    values.push(data.video_url); // $4
    values.push(data.thumbnail_url || null); // $5
    values.push(data.blob_url); // $6
    values.push(data.file_name); // $7
    values.push(data.file_size || null); // $8
    values.push(data.duration || null); // $9
    values.push(new Date()); // $10 - created_at
    values.push(new Date()); // $11 - updated_at
    
    // Execute INSERT query
    const query = `INSERT INTO videos (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
    console.log(`[createVideo] SQL: ${query}`);
    console.log(`[createVideo] Values:`, values);
    
    const insertResults = await prisma.$queryRawUnsafe<Array<any>>(query, ...values) as any[];
    
    if (!insertResults || insertResults.length === 0) {
      throw new Error("Failed to create video - no result returned");
    }
    
    const video = insertResults[0];
    console.log(`[createVideo] Video created successfully with ID: ${video.id}`);
    
    // Fetch the complete video using raw SQL to get all fields
    const fetchQuery = `SELECT * FROM videos WHERE id = $1`;
    const fetchResults = await prisma.$queryRawUnsafe<Array<any>>(fetchQuery, video.id) as any[];
    
    if (!fetchResults || fetchResults.length === 0) {
      throw new Error("Failed to fetch created video");
    }
    
    const createdVideo = fetchResults[0];
    
    // Normalize the response to match Video interface
    return {
      id: createdVideo.id,
      title: createdVideo.title,
      description: createdVideo.description,
      category: createdVideo.category,
      video_url: createdVideo.video_url,
      thumbnail_url: createdVideo.thumbnail_url,
      blob_url: createdVideo.blob_url,
      file_name: createdVideo.file_name,
      file_size: createdVideo.file_size ? Number(createdVideo.file_size) : null,
      duration: createdVideo.duration || null,
      display_date: createdVideo.display_date ? (typeof createdVideo.display_date === 'string' ? createdVideo.display_date : createdVideo.display_date.toISOString()) : null,
      is_visible: createdVideo.is_visible !== null && createdVideo.is_visible !== undefined ? Boolean(createdVideo.is_visible) : true,
      created_at: createdVideo.created_at ? (typeof createdVideo.created_at === 'string' ? createdVideo.created_at : createdVideo.created_at.toISOString()) : new Date().toISOString(),
      updated_at: createdVideo.updated_at ? (typeof createdVideo.updated_at === 'string' ? createdVideo.updated_at : createdVideo.updated_at.toISOString()) : new Date().toISOString(),
    } as Video;
  } catch (error) {
    console.error("[createVideo] Error:", error);
    console.error("[createVideo] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[createVideo] Error stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  }
}

export async function updateVideo(
  id: number,
  data: {
    title?: string;
    description?: string;
    category?: string;
    display_date?: string;
    is_visible?: boolean;
  }
): Promise<Video | null> {
  try {
    console.log(`[updateVideo] Updating video ${id} with:`, data);
    
    // Use raw SQL directly - more reliable and avoids Prisma schema issues
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build UPDATE query with only provided fields
    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(data.title);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(data.description || null);
      paramIndex++;
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(data.category || null);
      paramIndex++;
    }
    
    // Always update timestamp
    updates.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;
    
    if (updates.length === 0) {
      throw new Error("No valid fields to update");
    }
    
    // Add id for WHERE clause
    const idParamIndex = paramIndex;
    values.push(id);
    
    // Execute UPDATE query
    const query = `UPDATE videos SET ${updates.join(", ")} WHERE id = $${idParamIndex} RETURNING id`;
    console.log(`[updateVideo] SQL: ${query}`);
    console.log(`[updateVideo] Values:`, values);
    
    const updateResult = await prisma.$queryRawUnsafe<Array<{ id: number }>>(query, ...values) as any[];
    
    if (!updateResult || updateResult.length === 0) {
      console.error(`[updateVideo] Video ${id} not found`);
      return null;
    }
    
    console.log(`[updateVideo] Update successful, fetching video data...`);
    
    // Fetch the complete updated video using raw SQL (avoids schema issues)
    // Use SELECT * to get all columns regardless of schema
    const fetchQuery = `SELECT * FROM videos WHERE id = $1`;
    const fetchResults = await prisma.$queryRawUnsafe<Array<any>>(fetchQuery, id) as any[];
    
    if (!fetchResults || fetchResults.length === 0) {
      console.error(`[updateVideo] Could not fetch updated video ${id}`);
      return null;
    }
    
    const updatedVideo = fetchResults[0];
    console.log(`[updateVideo] Video ${id} updated successfully`);
    
    // Normalize the response to match Video interface
    return {
      id: updatedVideo.id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      category: updatedVideo.category,
      video_url: updatedVideo.video_url,
      thumbnail_url: updatedVideo.thumbnail_url,
      blob_url: updatedVideo.blob_url,
      file_name: updatedVideo.file_name,
      file_size: updatedVideo.file_size ? Number(updatedVideo.file_size) : null,
      duration: updatedVideo.duration || null,
      display_date: updatedVideo.display_date ? (typeof updatedVideo.display_date === 'string' ? updatedVideo.display_date : updatedVideo.display_date.toISOString()) : null,
      is_visible: updatedVideo.is_visible !== null && updatedVideo.is_visible !== undefined ? Boolean(updatedVideo.is_visible) : true,
      created_at: updatedVideo.created_at ? (typeof updatedVideo.created_at === 'string' ? updatedVideo.created_at : updatedVideo.created_at.toISOString()) : new Date().toISOString(),
      updated_at: updatedVideo.updated_at ? (typeof updatedVideo.updated_at === 'string' ? updatedVideo.updated_at : updatedVideo.updated_at.toISOString()) : new Date().toISOString(),
    } as Video;
  } catch (error) {
    console.error("[updateVideo] Error:", error);
    console.error("[updateVideo] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[updateVideo] Error stack:", error instanceof Error ? error.stack : "No stack");
    throw error; // Re-throw so API route can handle it
  }
}

export async function deleteVideo(id: number): Promise<boolean> {
  try {
    await prisma.video.delete({
      where: { id },
    });
    return true;
  } catch (error: any) {
    console.error("Error in deleteVideo:", error);
    const errorMsg = error?.message?.toLowerCase() || "";
    
    // If Prisma fails, use raw SQL (simpler and more reliable)
    if (errorMsg.includes("column") || errorMsg.includes("does not exist") || errorMsg.includes("unknown argument") || error?.code === 'P2022') {
      console.warn("Prisma delete failed, using raw SQL delete");
      const result = await prisma.$executeRawUnsafe(`DELETE FROM videos WHERE id = $1`, id);
      return true; // Raw SQL delete succeeded
    }
    
    // Re-throw other errors
    throw error;
  }
}
