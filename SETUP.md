# Video Management System Setup Guide

This guide walks you through setting up the video management system for your production company website.

## Overview

The system uses:
- **Vercel Blob Storage** - For storing 4K video files
- **Vercel Postgres** - For storing video metadata
- **Next.js API Routes** - For upload/delete functionality
- **React Player** - For 4K video playback

## Step 1: Set Up Vercel Blob Storage

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Blob**
3. Create a new Blob store (or use an existing one)
4. Copy the Blob store URL - you'll need this for environment variables

## Step 2: Set Up Vercel Postgres Database

1. In your Vercel project, go to **Storage** → **Postgres**
2. Create a new Postgres database
3. Copy the connection string - you'll need this for environment variables

## Step 3: Run Database Migration

1. Connect to your Vercel Postgres database using the connection string
2. Run the SQL schema from `lib/db/schema.sql`:

```sql
-- Video metadata table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  blob_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
```

**Alternative: Using Vercel CLI**

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run the SQL migration
vercel db execute lib/db/schema.sql
```

## Step 4: Set Environment Variables

Create a `.env.local` file in your project root with:

```env
# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Vercel Postgres
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
```

**To get these values:**
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. The Postgres URLs are automatically added when you create a Postgres database
3. For Blob token, go to **Storage** → **Blob** → Your store → **Settings** → **Tokens**

## Step 5: Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
pnpm install
```

## Step 6: Run the Development Server

```bash
pnpm dev
```

## Step 7: Access Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. Upload your first video:
   - Select a video file (supports 4K)
   - Enter a title (required)
   - Add a description (optional)
   - Select a category (Recent Work, Industry Work, Music Video, Narrative)
   - Click "Upload Video"

## Step 8: View Videos on Homepage

1. Go to `http://localhost:3000`
2. Click "RECENT WORK" or any category button
3. Videos will appear in a grid
4. Click any video to play it in 4K

## Video Categories

- **recent-work** - Recent Work
- **industry-work** - Industry Work
- **music-video** - Music Video
- **narrative** - Narrative

## API Endpoints

### GET /api/videos
Fetch all videos (optionally filtered by category)

**Query Parameters:**
- `category` (optional) - Filter by category

**Example:**
```
GET /api/videos?category=recent-work
```

### POST /api/videos
Upload a new video

**Body (FormData):**
- `video` (File) - Video file
- `title` (string) - Video title (required)
- `description` (string, optional) - Video description
- `category` (string, optional) - Video category

### DELETE /api/videos/[id]
Delete a video

**Example:**
```
DELETE /api/videos/1
```

## 4K Video Support

- Videos are stored in Vercel Blob Storage with public access
- React Player supports 4K playback natively
- Videos stream directly from Blob Storage
- No transcoding is performed (videos are served as-is)

## Cost Considerations

### Vercel Blob Storage
- **Free tier**: 1 GB storage, 100 GB bandwidth/month
- **Pro tier**: $0.15/GB storage, $0.40/GB bandwidth
- **Enterprise**: Custom pricing

### Vercel Postgres
- **Hobby**: Free (limited to development)
- **Pro**: $20/month (256 MB storage, 60 hours compute)
- **Enterprise**: Custom pricing

**Tip**: For large 4K video files, consider:
- Compressing videos before upload
- Using a CDN for better delivery
- Implementing video thumbnails to reduce bandwidth
- Using Mux (Option 2) for better video optimization and adaptive streaming

## Troubleshooting

### Videos not loading
- Check that Vercel Blob Storage is properly configured
- Verify environment variables are set correctly
- Check browser console for errors

### Database errors
- Ensure Postgres database is created and migrated
- Verify POSTGRES_URL environment variable is correct
- Check database connection in Vercel dashboard

### Upload fails
- Check file size limits (Vercel Blob has limits)
- Verify BLOB_READ_WRITE_TOKEN is set correctly
- Check network connection for large files

## Next Steps

1. **Add Authentication**: Protect the admin panel with authentication
2. **Add Thumbnails**: Generate video thumbnails for better UX
3. **Add Video Metadata**: Extract duration, resolution, etc. from videos
4. **Optimize for Mobile**: Ensure 4K videos work well on mobile devices
5. **Add Analytics**: Track video views and engagement

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check React Player documentation: https://github.com/cookpete/react-player

