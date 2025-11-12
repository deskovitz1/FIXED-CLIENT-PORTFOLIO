# Option 1: Vercel Stack - Complete Guide

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│                 │
│  - Homepage     │
│  - Admin Panel  │
│  - Video Player │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   API Routes │  │ Vercel Blob  │  │ Vercel       │
│   (Next.js)  │  │ Storage      │  │ Postgres     │
│              │  │              │  │              │
│  - Upload    │  │ - 4K Videos  │  │ - Metadata   │
│  - Delete    │  │ - Public URLs│  │ - Categories │
│  - Fetch     │  │              │  │ - Titles     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## How It Works

### 1. **Video Upload Flow**
```
User → Admin Panel → API Route → Vercel Blob → Database
                      (POST /api/videos)
```

**Steps:**
1. User selects video file in admin panel (`/admin`)
2. Form data is sent to `POST /api/videos`
3. API route uploads video to Vercel Blob Storage
4. API route saves metadata (title, URL, category) to Postgres
5. Success response returned to admin panel

### 2. **Video Display Flow**
```
Homepage → API Route → Database → Grid Display → Video Player
           (GET /api/videos)
```

**Steps:**
1. User clicks category button (e.g., "Recent Work")
2. Frontend fetches videos from `GET /api/videos?category=recent-work`
3. Videos are displayed in a grid
4. User clicks a video thumbnail
5. Video player opens with 4K video from Blob Storage

### 3. **Video Deletion Flow**
```
Admin Panel → API Route → Vercel Blob → Database
              (DELETE /api/videos/[id])
```

**Steps:**
1. User clicks delete button in admin panel
2. Frontend sends `DELETE /api/videos/[id]` request
3. API route deletes video from Blob Storage
4. API route deletes metadata from Postgres
5. Grid refreshes to show updated list

## File Structure

```
├── app/
│   ├── api/
│   │   └── videos/
│   │       ├── route.ts          # GET, POST /api/videos
│   │       └── [id]/
│   │           └── route.ts      # GET, DELETE /api/videos/[id]
│   ├── admin/
│   │   └── page.tsx              # Admin panel for upload/delete
│   └── layout.tsx                # Root layout with Toaster
├── components/
│   ├── video-homepage.tsx        # Main homepage with video grid
│   └── video-player.tsx          # 4K video player component
├── lib/
│   ├── db.ts                     # Database helper functions
│   └── db/
│       └── schema.sql            # Database schema
└── SETUP.md                      # Setup instructions
```

## Key Features

### ✅ **4K Video Support**
- Videos stored in Vercel Blob Storage
- React Player supports 4K playback
- Videos stream directly from Blob URLs
- No transcoding required

### ✅ **Category Filtering**
- Videos organized by category
- Categories: Recent Work, Industry Work, Music Video, Narrative
- Easy to filter and display

### ✅ **Admin Panel**
- Upload videos with metadata
- Delete videos
- View all videos
- Simple, clean interface

### ✅ **Video Grid**
- Responsive grid layout
- Hover effects
- Click to play
- Empty state handling

### ✅ **Video Player**
- Full-screen 4K playback
- Native browser controls
- Close button
- Title display

## Database Schema

```sql
videos
├── id (SERIAL PRIMARY KEY)
├── title (VARCHAR(255))
├── description (TEXT)
├── category (VARCHAR(100))
├── video_url (TEXT)
├── thumbnail_url (TEXT)
├── blob_url (TEXT)
├── file_name (VARCHAR(255))
├── file_size (BIGINT)
├── duration (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## API Endpoints

### `GET /api/videos`
Fetch all videos (optionally filtered by category)

**Response:**
```json
{
  "videos": [
    {
      "id": 1,
      "title": "My Video",
      "description": "Video description",
      "category": "recent-work",
      "video_url": "https://...",
      "blob_url": "https://...",
      "file_name": "video.mp4",
      "file_size": 1048576,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/videos`
Upload a new video

**Request (FormData):**
- `video` (File) - Video file
- `title` (string) - Video title
- `description` (string, optional) - Video description
- `category` (string, optional) - Video category

**Response:**
```json
{
  "video": {
    "id": 1,
    "title": "My Video",
    ...
  }
}
```

### `DELETE /api/videos/[id]`
Delete a video

**Response:**
```json
{
  "success": true
}
```

## Environment Variables

Required environment variables:

```env
# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_token_here

# Vercel Postgres
POSTGRES_URL=your_connection_string
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
```

## Setup Steps

1. **Create Vercel Blob Store**
   - Go to Vercel Dashboard → Storage → Blob
   - Create new store
   - Copy token to `.env.local`

2. **Create Vercel Postgres Database**
   - Go to Vercel Dashboard → Storage → Postgres
   - Create new database
   - Connection strings auto-added to environment

3. **Run Database Migration**
   - Execute `lib/db/schema.sql` in your database
   - Or use Vercel CLI: `vercel db execute lib/db/schema.sql`

4. **Set Environment Variables**
   - Create `.env.local` with required variables
   - Or use Vercel Dashboard → Settings → Environment Variables

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Access Admin Panel**
   - Navigate to `http://localhost:3000/admin`
   - Upload your first video

## Pros & Cons

### ✅ Pros
- **Simple Setup**: Uses Vercel's built-in services
- **Integrated**: Works seamlessly with Next.js
- **Cost Effective**: Free tier available for development
- **4K Support**: Direct video streaming from Blob Storage
- **Fast**: No transcoding delay

### ❌ Cons
- **No Transcoding**: Videos served as-is (no adaptive streaming)
- **Bandwidth Costs**: Large 4K files can be expensive
- **No Thumbnails**: Manual thumbnail generation required
- **No Analytics**: No built-in video analytics
- **File Size Limits**: Vercel Blob has upload size limits

## Cost Estimation

### Development (Free Tier)
- Vercel Blob: 1 GB storage, 100 GB bandwidth
- Vercel Postgres: Hobby tier (development only)

### Production (Pro Tier)
- Vercel Blob: $0.15/GB storage, $0.40/GB bandwidth
- Vercel Postgres: $20/month (256 MB storage)

**Example:**
- 10 videos × 500 MB each = 5 GB storage = $0.75/month
- 1000 views × 500 MB each = 500 GB bandwidth = $200/month
- **Total: ~$221/month** (plus Postgres $20/month)

## Recommendations

### For Small Production Company
- ✅ Use Option 1 (Vercel Stack)
- Compress videos before upload
- Use thumbnails to reduce bandwidth
- Monitor bandwidth usage

### For Large Production Company
- Consider Option 2 (Mux) for better video optimization
- Implement adaptive streaming
- Add video analytics
- Use CDN for better delivery

## Next Steps

1. **Add Authentication**: Protect admin panel
2. **Add Thumbnails**: Generate video thumbnails
3. **Add Video Metadata**: Extract duration, resolution
4. **Optimize Uploads**: Add progress indicators
5. **Add Analytics**: Track video views
6. **Mobile Optimization**: Ensure 4K works on mobile

## Support

For issues or questions:
- Check `SETUP.md` for detailed setup instructions
- Check Vercel documentation: https://vercel.com/docs
- Check React Player: https://github.com/cookpete/react-player

