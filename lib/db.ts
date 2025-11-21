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
  created_at: string;
  updated_at: string;
}

// Intro video URL and filename - excluded from regular video listings
const INTRO_VIDEO_URL = "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/smaller%20intro%20video-2OLEoXDlOrPov0XwuKOqHmFHls7C3P.mp4"
const INTRO_VIDEO_FILENAME = "smaller intro video"

export async function getVideos(category?: string, excludeIntro: boolean = true): Promise<Video[]> {
  try {
    const whereClause: any = {}
    
    // Build conditions array
    const conditions: any[] = []
    
    if (category) {
      conditions.push({ category })
    }
    
    // Exclude intro video from regular listings (by filename or URL)
    // Use OR to exclude if ANY of these match, then negate with NOT
    if (excludeIntro) {
      conditions.push({
        NOT: {
          OR: [
            {
              file_name: {
                contains: INTRO_VIDEO_FILENAME,
              },
            },
            {
              blob_url: {
                contains: INTRO_VIDEO_URL,
              },
            },
            {
              video_url: {
                contains: INTRO_VIDEO_URL,
              },
            },
          ],
        },
      })
    }
    
    // Only use AND if we have multiple conditions
    if (conditions.length > 1) {
      whereClause.AND = conditions
    } else if (conditions.length === 1) {
      Object.assign(whereClause, conditions[0])
    }
    
    const videos = await prisma.video.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });
    return videos.map((v: any) => ({
      ...v,
      file_size: v.file_size ? Number(v.file_size) : null,
      created_at: v.created_at.toISOString(),
      updated_at: v.updated_at.toISOString(),
    })) as Video[];
  } catch (error) {
    console.error("Error in getVideos:", error);
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
      created_at: video.created_at.toISOString(),
      updated_at: video.updated_at.toISOString(),
    } as Video;
  } catch (error) {
    console.error("Error in getIntroVideo:", error);
    return null;
  }
}

export async function getVideoById(id: number): Promise<Video | null> {
  const video = await prisma.video.findUnique({
    where: { id },
  });
  return video as Video | null;
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
}): Promise<Video> {
  const video = await prisma.video.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      video_url: data.video_url,
      thumbnail_url: data.thumbnail_url || null,
      blob_url: data.blob_url,
      file_name: data.file_name,
      file_size: data.file_size ? BigInt(data.file_size) : null,
      duration: data.duration || null,
    },
  });
  return {
    ...video,
    file_size: video.file_size ? Number(video.file_size) : null,
  } as Video;
}

export async function deleteVideo(id: number): Promise<boolean> {
  try {
    await prisma.video.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    return false;
  }
}
