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
  sort_order: number | null;
  vimeo_id: string | null; // Vimeo video ID (numeric string)
  vimeo_hash: string | null; // Vimeo hash for unlisted videos (e.g., "ab8ee4cce4")
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
    
    // Use raw SQL to ensure vimeo_id is always included
    // Prisma findMany might not include vimeo_id if client wasn't regenerated
    let videos: any[];
    let sqlWhere = "";
    if (category) {
      sqlWhere += ` WHERE category = '${category.replace(/'/g, "''")}'`;
    }
    if (excludeIntro) {
      sqlWhere += category ? ` AND file_name NOT LIKE '%${INTRO_VIDEO_FILENAME.replace(/'/g, "''")}%'` : ` WHERE file_name NOT LIKE '%${INTRO_VIDEO_FILENAME.replace(/'/g, "''")}%'`;
    }
    // Try to sort by sort_order, fallback to created_at
    try {
      videos = await prisma.$queryRawUnsafe<Array<any>>(`SELECT * FROM videos${sqlWhere} ORDER BY COALESCE(sort_order, 999999), created_at DESC`);
    } catch {
      videos = await prisma.$queryRawUnsafe<Array<any>>(`SELECT * FROM videos${sqlWhere} ORDER BY created_at DESC`);
    }
    
    // Log to verify vimeo_id is being fetched
    console.log(`[getVideos] Fetched ${videos.length} videos. Sample vimeo_id values:`, 
      videos.slice(0, 3).map(v => ({ id: v.id, title: v.title, vimeo_id: v.vimeo_id }))
    );
    
    // Normalize Prisma DateTime objects to ISO strings for the Video interface
    const mappedVideos = videos.map((v: any) => ({
      id: v.id,
      title: v.title || "",
      description: v.description,
      category: v.category,
      video_url: v.video_url || v.blob_url || "",
      thumbnail_url: v.thumbnail_url,
      blob_url: v.blob_url || v.video_url || "",
      file_name: v.file_name || "",
      file_size: v.file_size ? Number(v.file_size) : null,
      duration: v.duration || null,
      display_date: v.display_date ? (typeof v.display_date === 'string' ? v.display_date : v.display_date.toISOString()) : null,
      is_visible: v.is_visible !== null && v.is_visible !== undefined ? Boolean(v.is_visible) : true,
      sort_order: v.sort_order !== null && v.sort_order !== undefined ? Number(v.sort_order) : null,
      vimeo_id: v.vimeo_id || null,
      vimeo_hash: v.vimeo_hash || null,
      created_at: v.created_at ? (typeof v.created_at === 'string' ? v.created_at : v.created_at.toISOString()) : new Date().toISOString(),
      updated_at: v.updated_at ? (typeof v.updated_at === 'string' ? v.updated_at : v.updated_at.toISOString()) : new Date().toISOString(),
    })) as Video[];
    
    return mappedVideos;
  } catch (error) {
    console.error("Error in getVideos:", error);
    return [];
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
      id: video.id,
      title: video.title || "",
      description: video.description,
      category: video.category,
      video_url: video.video_url || video.blob_url || "",
      thumbnail_url: video.thumbnail_url,
      blob_url: video.blob_url || video.video_url || "",
      file_name: video.file_name || "",
      file_size: video.file_size ? Number(video.file_size) : null,
      duration: video.duration || null,
      display_date: video.display_date ? (typeof video.display_date === 'string' ? video.display_date : video.display_date.toISOString()) : null,
      is_visible: video.is_visible !== null && video.is_visible !== undefined ? Boolean(video.is_visible) : true,
      sort_order: video.sort_order !== null && video.sort_order !== undefined ? Number(video.sort_order) : null,
      vimeo_id: video.vimeo_id || null, // CRITICAL: Explicitly include vimeo_id
      vimeo_hash: video.vimeo_hash || null, // CRITICAL: Explicitly include vimeo_hash
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
  video_url?: string; // Optional if using Vimeo
  thumbnail_url?: string;
  blob_url?: string; // Optional if using Vimeo
  file_name: string;
  file_size?: number;
  duration?: number;
  display_date?: string;
  vimeo_id?: string;
  vimeo_hash?: string;
}): Promise<Video> {
  try {
    console.log(`[createVideo] Creating video:`, { title: data.title, file_name: data.file_name });
    
    // Use raw SQL directly - more reliable and avoids Prisma schema issues
    // Build columns and values dynamically, excluding vimeo_id if column doesn't exist
    const columns: string[] = ['title', 'description', 'category', 'video_url', 'thumbnail_url', 'blob_url', 'file_name', 'file_size', 'duration', 'created_at', 'updated_at'];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build INSERT query with only basic fields that should always exist
    // If using Vimeo and no blob URL, use empty string (not a placeholder URL)
    // The video player will check for vimeo_id first, so we don't need a placeholder
    const videoUrl = data.video_url || '';
    const blobUrl = data.blob_url || '';
    
    values.push(data.title); // $1
    values.push(data.description || null); // $2
    values.push(data.category || null); // $3
    values.push(videoUrl); // $4
    values.push(data.thumbnail_url || null); // $5
    values.push(blobUrl); // $6
    values.push(data.file_name); // $7
    values.push(data.file_size || null); // $8
    values.push(data.duration || null); // $9
    values.push(new Date()); // $10 - created_at
    values.push(new Date()); // $11 - updated_at
    
    // Try to include vimeo_id if provided, but handle gracefully if column doesn't exist
    let includeVimeoId = false;
    if (data.vimeo_id) {
      // Check if vimeo_id column exists by trying a test query
      try {
        await prisma.$queryRawUnsafe(`SELECT vimeo_id FROM videos LIMIT 1`);
        includeVimeoId = true;
      } catch (err: any) {
        const errorMsg = (err?.message || '').toLowerCase();
        if (errorMsg.includes('vimeo_id') && (errorMsg.includes('does not exist') || errorMsg.includes('column'))) {
          console.warn(`[createVideo] vimeo_id column doesn't exist, skipping it. Run 'pnpm db:push' to add it.`);
          includeVimeoId = false;
        } else {
          throw err; // Re-throw if it's a different error
        }
      }
    }
    
    if (includeVimeoId && data.vimeo_id) {
      columns.splice(9, 0, 'vimeo_id'); // Insert vimeo_id before created_at
      values.splice(9, 0, data.vimeo_id); // Insert vimeo_id value
    }
    
    // Try to include vimeo_hash if provided
    let includeVimeoHash = false;
    if (data.vimeo_hash) {
      try {
        await prisma.$queryRawUnsafe(`SELECT vimeo_hash FROM videos LIMIT 1`);
        includeVimeoHash = true;
      } catch (err: any) {
        const errorMsg = (err?.message || '').toLowerCase();
        if (errorMsg.includes('vimeo_hash') && (errorMsg.includes('does not exist') || errorMsg.includes('column'))) {
          console.warn(`[createVideo] vimeo_hash column doesn't exist, skipping it. Run 'pnpm db:push' to add it.`);
          includeVimeoHash = false;
        } else {
          throw err;
        }
      }
    }
    
    if (includeVimeoHash && data.vimeo_hash) {
      const insertIndex = includeVimeoId ? 10 : 9; // After vimeo_id if present, otherwise before created_at
      columns.splice(insertIndex, 0, 'vimeo_hash');
      values.splice(insertIndex, 0, data.vimeo_hash);
    }
    
    // Execute INSERT query
    const query = `INSERT INTO videos (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
    console.log(`[createVideo] SQL: ${query}`);
    console.log(`[createVideo] Values:`, values);
    
    let insertResults: any[];
    try {
      insertResults = await prisma.$queryRawUnsafe<Array<any>>(query, ...values) as any[];
    } catch (insertError: any) {
      // If insert fails due to vimeo_id column, retry without it
      const errorMsg = (insertError?.message || '').toLowerCase();
      if (includeVimeoId && errorMsg.includes('vimeo_id') && (errorMsg.includes('does not exist') || errorMsg.includes('column'))) {
        console.warn(`[createVideo] Retrying without vimeo_id column...`);
        // Rebuild columns and values without vimeo_id
        const retryColumns = columns.filter(col => col !== 'vimeo_id');
        const retryValues: any[] = [];
        retryValues.push(data.title); // $1
        retryValues.push(data.description || null); // $2
        retryValues.push(data.category || null); // $3
        retryValues.push(videoUrl); // $4
        retryValues.push(data.thumbnail_url || null); // $5
        retryValues.push(blobUrl); // $6
        retryValues.push(data.file_name); // $7
        retryValues.push(data.file_size || null); // $8
        retryValues.push(data.duration || null); // $9
        retryValues.push(new Date()); // $10 - created_at
        retryValues.push(new Date()); // $11 - updated_at
        const retryQuery = `INSERT INTO videos (${retryColumns.join(', ')}) VALUES (${retryColumns.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
        console.log(`[createVideo] Retry SQL: ${retryQuery}`);
        insertResults = await prisma.$queryRawUnsafe<Array<any>>(retryQuery, ...retryValues) as any[];
        console.warn(`[createVideo] Video created without vimeo_id/vimeo_hash. Run 'pnpm db:push' to add the columns, then update the video with the Vimeo ID/hash.`);
      } else {
        throw insertError;
      }
    }
    
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
      vimeo_id: createdVideo.vimeo_id || null,
      vimeo_hash: createdVideo.vimeo_hash || null,
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
    thumbnail_url?: string | null;
    sort_order?: number | null;
    vimeo_id?: string | null;
    vimeo_hash?: string | null;
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
    if (data.display_date !== undefined) {
      updates.push(`display_date = $${paramIndex}`);
      // Convert date string to Date object, or null if empty
      // Date input format is YYYY-MM-DD, convert to proper Date object
      const dateValue = data.display_date && data.display_date.trim() 
        ? new Date(data.display_date + 'T00:00:00Z') // Add time to ensure consistent date
        : null;
      console.log(`[updateVideo] Converting display_date: "${data.display_date}" -> ${dateValue}`);
      values.push(dateValue);
      paramIndex++;
    }
    if (data.is_visible !== undefined) {
      updates.push(`is_visible = $${paramIndex}`);
      values.push(data.is_visible);
      paramIndex++;
    }
    if (data.thumbnail_url !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex}`);
      values.push(data.thumbnail_url || null);
      paramIndex++;
    }
    if (data.vimeo_id !== undefined) {
      updates.push(`vimeo_id = $${paramIndex}`);
      values.push(data.vimeo_id || null);
      paramIndex++;
    }
    if (data.vimeo_hash !== undefined) {
      updates.push(`vimeo_hash = $${paramIndex}`);
      values.push(data.vimeo_hash || null);
      paramIndex++;
    }
    if (data.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex}`);
      values.push(data.sort_order);
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
    
    let updateResult: any[];
    try {
      updateResult = await prisma.$queryRawUnsafe<Array<{ id: number }>>(query, ...values) as any[];
    } catch (queryError: any) {
      // Check if error is due to missing column (display_date, vimeo_id, or vimeo_hash)
      const errorMsg = queryError?.message?.toLowerCase() || '';
      const isMissingColumn = (errorMsg.includes('does not exist') || errorMsg.includes('column')) && 
                              (errorMsg.includes('display_date') || errorMsg.includes('vimeo_id') || errorMsg.includes('vimeo_hash'));
      
      if (isMissingColumn) {
        const missingColumn = errorMsg.includes('display_date') ? 'display_date' : 
                             errorMsg.includes('vimeo_hash') ? 'vimeo_hash' : 'vimeo_id';
        console.warn(`[updateVideo] ${missingColumn} column doesn't exist, trying without it...`);
        
        // Rebuild updates and values without the missing column
        const rebuiltUpdates: string[] = [];
        const rebuiltValues: any[] = [];
        let rebuildParamIndex = 1;
        
        if (data.title !== undefined) {
          rebuiltUpdates.push(`title = $${rebuildParamIndex}`);
          rebuiltValues.push(data.title);
          rebuildParamIndex++;
        }
        if (data.description !== undefined) {
          rebuiltUpdates.push(`description = $${rebuildParamIndex}`);
          rebuiltValues.push(data.description || null);
          rebuildParamIndex++;
        }
        if (data.category !== undefined) {
          rebuiltUpdates.push(`category = $${rebuildParamIndex}`);
          rebuiltValues.push(data.category || null);
          rebuildParamIndex++;
        }
        // Skip display_date if column doesn't exist
        if (data.display_date !== undefined && missingColumn !== 'display_date') {
          rebuiltUpdates.push(`display_date = $${rebuildParamIndex}`);
          const dateValue = data.display_date && data.display_date.trim() 
            ? new Date(data.display_date + 'T00:00:00Z')
            : null;
          rebuiltValues.push(dateValue);
          rebuildParamIndex++;
        }
        // Skip vimeo_id if column doesn't exist
        if (data.vimeo_id !== undefined && missingColumn !== 'vimeo_id') {
          rebuiltUpdates.push(`vimeo_id = $${rebuildParamIndex}`);
          rebuiltValues.push(data.vimeo_id || null);
          rebuildParamIndex++;
        }
        // Skip vimeo_hash if column doesn't exist
        if (data.vimeo_hash !== undefined && missingColumn !== 'vimeo_hash') {
          rebuiltUpdates.push(`vimeo_hash = $${rebuildParamIndex}`);
          rebuiltValues.push(data.vimeo_hash || null);
          rebuildParamIndex++;
        }
        if (data.is_visible !== undefined) {
          rebuiltUpdates.push(`is_visible = $${rebuildParamIndex}`);
          rebuiltValues.push(data.is_visible);
          rebuildParamIndex++;
        }
        if (data.thumbnail_url !== undefined) {
          rebuiltUpdates.push(`thumbnail_url = $${rebuildParamIndex}`);
          rebuiltValues.push(data.thumbnail_url || null);
          rebuildParamIndex++;
        }
        rebuiltUpdates.push(`updated_at = $${rebuildParamIndex}`);
        rebuiltValues.push(new Date());
        rebuildParamIndex++;
        
        const idParam = rebuildParamIndex;
        rebuiltValues.push(id);
        
        const fallbackQuery = `UPDATE videos SET ${rebuiltUpdates.join(", ")} WHERE id = $${idParam} RETURNING id`;
        console.log(`[updateVideo] Retrying without ${missingColumn}: ${fallbackQuery}`);
        
        try {
          updateResult = await prisma.$queryRawUnsafe<Array<{ id: number }>>(fallbackQuery, ...rebuiltValues) as any[];
          
          // Log warning about missing column - but don't throw if we successfully updated other fields
          console.warn(`[updateVideo] WARNING: ${missingColumn} column doesn't exist in database. The ${missingColumn} was not saved.`);
          console.warn(`[updateVideo] Other fields were updated successfully, but ${missingColumn} was skipped.`);
          console.warn(`[updateVideo] To fix this, sync your Prisma schema to the database:`);
          console.warn(`  pnpm db:push`);
          console.warn(`  pnpm db:generate`);
        } catch (retryError) {
          // If retry also fails, throw the original error
          throw queryError;
        }
      } else {
        throw queryError;
      }
    }
    
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
    console.log(`[updateVideo] Updated video vimeo_id:`, updatedVideo.vimeo_id);
    
    // Normalize the response to match Video interface
    // Format display_date properly - if it's a Date object, convert to ISO string, then to YYYY-MM-DD format for date input
    let displayDateFormatted = null;
    if (updatedVideo.display_date) {
      const dateObj = typeof updatedVideo.display_date === 'string' 
        ? new Date(updatedVideo.display_date) 
        : updatedVideo.display_date;
      displayDateFormatted = dateObj.toISOString();
    }
    
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
      display_date: displayDateFormatted,
      is_visible: updatedVideo.is_visible !== null && updatedVideo.is_visible !== undefined ? Boolean(updatedVideo.is_visible) : true,
      sort_order: updatedVideo.sort_order !== null && updatedVideo.sort_order !== undefined ? Number(updatedVideo.sort_order) : null,
      vimeo_id: updatedVideo.vimeo_id || null, // CRITICAL: Include vimeo_id in returned Video
      vimeo_hash: updatedVideo.vimeo_hash || null, // CRITICAL: Include vimeo_hash in returned Video
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
