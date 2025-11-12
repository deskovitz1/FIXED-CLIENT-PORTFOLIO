import { sql } from "@vercel/postgres";

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

export async function getVideos(category?: string): Promise<Video[]> {
  if (category) {
    const result = await sql`
      SELECT * FROM videos 
      WHERE category = ${category}
      ORDER BY created_at DESC
    `;
    return result.rows as Video[];
  }
  
  const result = await sql`
    SELECT * FROM videos 
    ORDER BY created_at DESC
  `;
  return result.rows as Video[];
}

export async function getVideoById(id: number): Promise<Video | null> {
  const result = await sql`
    SELECT * FROM videos 
    WHERE id = ${id}
    LIMIT 1
  `;
  return result.rows[0] as Video || null;
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
  const result = await sql`
    INSERT INTO videos (title, description, category, video_url, thumbnail_url, blob_url, file_name, file_size, duration)
    VALUES (${data.title}, ${data.description || null}, ${data.category || null}, ${data.video_url}, ${data.thumbnail_url || null}, ${data.blob_url}, ${data.file_name}, ${data.file_size || null}, ${data.duration || null})
    RETURNING *
  `;
  return result.rows[0] as Video;
}

export async function deleteVideo(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM videos 
    WHERE id = ${id}
    RETURNING id
  `;
  return result.rowCount > 0;
}

