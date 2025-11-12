# Quick Start Guide - How to Use the Video Management System

## Step 1: Set Up Vercel Blob Storage

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project (or create a new one)

2. **Create Blob Store**
   - Click on your project
   - Go to **Storage** tab → **Blob**
   - Click **Create Database** (or **Create Store**)
   - Name it (e.g., "video-storage")
   - Choose a region (closest to you)
   - Click **Create**

3. **Get Blob Token**
   - In your Blob store, go to **Settings** → **Tokens**
   - Click **Create Token**
   - Name it (e.g., "video-upload-token")
   - Copy the token (you'll need it in Step 3)

## Step 2: Set Up Vercel Postgres Database

1. **Create Postgres Database**
   - Still in your Vercel project
   - Go to **Storage** tab → **Postgres**
   - Click **Create Database**
   - Choose a region (same as Blob if possible)
   - Click **Create**

2. **Get Connection Strings**
   - Vercel automatically adds these to your environment variables
   - Go to **Settings** → **Environment Variables**
   - You should see:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`

## Step 3: Set Up Environment Variables

1. **Create `.env.local` file**
   - In your project root, create a file called `.env.local`
   - Add the following:

```env
# Vercel Blob Token (from Step 1)
BLOB_READ_WRITE_TOKEN=paste_your_blob_token_here

# Vercel Postgres (auto-added, but you can check in Vercel Dashboard)
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url_here
```

2. **Get the values:**
   - **BLOB_READ_WRITE_TOKEN**: From Step 1 (Blob store token)
   - **POSTGRES URLs**: From Vercel Dashboard → Settings → Environment Variables

## Step 4: Run Database Migration

You have two options:

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```
   - Select your Vercel account
   - Select your project

3. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

4. **Run the migration**:
   ```bash
   vercel db execute lib/db/schema.sql
   ```

### Option B: Using Vercel Dashboard

1. **Go to your Postgres database**
   - Vercel Dashboard → Your Project → Storage → Postgres
   - Click on your database

2. **Open the SQL Editor**
   - Click **SQL Editor** tab
   - Create a new query

3. **Run the migration SQL**
   - Copy the contents of `lib/db/schema.sql`
   - Paste into the SQL editor
   - Click **Run**

## Step 5: Start Your Development Server

```bash
pnpm dev
```

Your server should start at `http://localhost:3000`

## Step 6: Upload Your First Video

1. **Go to Admin Panel**
   - Open browser: `http://localhost:3000/admin`
   - You should see the upload form

2. **Upload a Video**
   - Click **Choose File** under "Video File"
   - Select a video file (supports 4K)
   - Enter a **Title** (required)
   - Add a **Description** (optional)
   - Select a **Category**:
     - Recent Work
     - Industry Work
     - Music Video
     - Narrative
   - Click **Upload Video**

3. **Wait for Upload**
   - You'll see "Uploading..." status
   - Once complete, you'll see a success message
   - The video will appear in the list below

## Step 7: View Videos on Homepage

1. **Go to Homepage**
   - Open: `http://localhost:3000`

2. **Click a Category Button**
   - Click **"RECENT WORK"** (or any category)
   - You'll see the transition animation
   - Videos will appear in a grid

3. **Play a Video**
   - Click on any video thumbnail
   - Video player opens in full screen
   - Play in 4K quality
   - Click **X** to close

## Step 8: Delete Videos (Optional)

1. **Go to Admin Panel**
   - `http://localhost:3000/admin`

2. **Find the Video**
   - Scroll to see all uploaded videos

3. **Delete Video**
   - Click the **trash icon** on the video card
   - Confirm deletion
   - Video is removed from both storage and database

## Troubleshooting

### "Failed to fetch videos"
- Check that Postgres database is created
- Verify `POSTGRES_URL` is set in `.env.local`
- Check database migration was run successfully

### "Failed to upload video"
- Check that Blob store is created
- Verify `BLOB_READ_WRITE_TOKEN` is set in `.env.local`
- Check file size (Vercel Blob has limits)

### "Video not playing"
- Check that video was uploaded successfully
- Verify video URL is accessible
- Check browser console for errors

### "Database error"
- Verify database migration was run
- Check Postgres connection in Vercel Dashboard
- Ensure environment variables are correct

## Quick Reference

### Admin Panel
- **URL**: `http://localhost:3000/admin`
- **Upload**: Select file, enter title, choose category, click Upload
- **Delete**: Click trash icon on video card

### Homepage
- **URL**: `http://localhost:3000`
- **View Videos**: Click category button (Recent Work, Industry Work, etc.)
- **Play Video**: Click video thumbnail

### API Endpoints
- **GET** `/api/videos` - Fetch all videos
- **GET** `/api/videos?category=recent-work` - Fetch by category
- **POST** `/api/videos` - Upload video
- **DELETE** `/api/videos/[id]` - Delete video

## Next Steps

1. **Add Authentication**: Protect admin panel with login
2. **Add Thumbnails**: Generate video thumbnails automatically
3. **Optimize Videos**: Compress videos before upload
4. **Add Analytics**: Track video views
5. **Deploy to Production**: Push to Vercel for live site

## Need Help?

- Check `SETUP.md` for detailed setup
- Check `OPTION1_GUIDE.md` for architecture details
- Check Vercel docs: https://vercel.com/docs

