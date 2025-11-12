# How to Use Your Video Management System

## 🚀 Quick Setup (5 minutes)

### 1. Create Vercel Blob Storage

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Storage** → **Blob**
4. Click **Create Database**
5. Name it "video-storage" and create it
6. Go to **Settings** → **Tokens** → **Create Token**
7. **Copy the token** (you'll need it next)

### 2. Create Vercel Postgres Database

1. Still in your Vercel project
2. Click **Storage** → **Postgres**
3. Click **Create Database**
4. Create it (connection strings are auto-added)

### 3. Set Up Environment Variables

Create a file called `.env.local` in your project root:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token_from_step_1
```

**Note**: Postgres URLs are automatically added by Vercel. If you're testing locally, you can get them from:
- Vercel Dashboard → Your Project → Settings → Environment Variables

### 4. Run Database Migration

**Option A: Using Vercel Dashboard (Easiest)**
1. Go to your Postgres database in Vercel Dashboard
2. Click **SQL Editor**
3. Copy and paste this SQL:

```sql
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

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
```

4. Click **Run**

**Option B: Using Vercel CLI**
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel db execute lib/db/schema.sql
```

### 5. Start Your Server

```bash
pnpm dev
```

## 📤 Upload Videos

1. **Go to Admin Panel**
   - Open: http://localhost:3000/admin

2. **Upload a Video**
   - Click **Choose File** and select a video
   - Enter a **Title** (required)
   - Add **Description** (optional)
   - Select a **Category**:
     - Recent Work
     - Industry Work
     - Music Video
     - Narrative
   - Click **Upload Video**

3. **Wait for Upload**
   - You'll see "Uploading..." 
   - Success message appears when done
   - Video appears in the list below

## 🎬 View Videos

1. **Go to Homepage**
   - Open: http://localhost:3000

2. **Click a Category**
   - Click **"RECENT WORK"** (or any category button)
   - Wait for transition animation
   - Videos appear in a grid

3. **Play a Video**
   - Click any video thumbnail
   - Video opens in full-screen player
   - Plays in 4K quality
   - Click **X** to close

## 🗑️ Delete Videos

1. **Go to Admin Panel**
   - http://localhost:3000/admin

2. **Delete a Video**
   - Find the video in the list
   - Click the **trash icon** 🗑️
   - Confirm deletion
   - Video is removed

## 🎯 Categories

Your videos are organized by category:

- **Recent Work** (`recent-work`)
- **Industry Work** (`industry-work`)
- **Music Video** (`music-video`)
- **Narrative** (`narrative`)

When you click a category button on the homepage, it shows only videos from that category.

## 📁 File Structure

```
Your Project/
├── app/
│   ├── admin/
│   │   └── page.tsx          ← Admin panel (upload/delete)
│   └── api/
│       └── videos/           ← API endpoints
├── components/
│   ├── video-homepage.tsx    ← Homepage with video grid
│   └── video-player.tsx      ← Video player component
├── lib/
│   ├── db.ts                 ← Database functions
│   └── db/
│       └── schema.sql        ← Database schema
└── .env.local                ← Your environment variables
```

## 🔧 Troubleshooting

### "Failed to fetch videos"
✅ **Fix**: 
- Check that Postgres database is created
- Verify database migration was run
- Check `POSTGRES_URL` in environment variables

### "Failed to upload video"
✅ **Fix**:
- Check that Blob store is created
- Verify `BLOB_READ_WRITE_TOKEN` is in `.env.local`
- Check file size (very large files may fail)

### "Video not playing"
✅ **Fix**:
- Check that video uploaded successfully
- Verify video URL is accessible
- Check browser console for errors

### "Database connection error"
✅ **Fix**:
- Make sure Postgres database is created
- Check environment variables are set
- Restart your dev server after adding env vars

## 🎥 Video Tips

1. **File Formats**: Supports MP4, WebM, MOV, etc.
2. **File Size**: Large 4K files may take time to upload
3. **Quality**: Videos play in original quality (4K supported)
4. **Bandwidth**: Large videos use more bandwidth

## 🚀 Deploy to Production

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add Environment Variables** in Vercel Dashboard:
   - `BLOB_READ_WRITE_TOKEN`
   - Postgres URLs are auto-added
4. **Deploy**
5. **Run Migration** on production database
6. **Access Admin Panel**: `https://your-site.com/admin`

## 📊 What You Can Do

✅ Upload 4K videos
✅ Organize by category
✅ Delete videos
✅ Play videos in full-screen
✅ View all videos in admin panel
✅ Filter videos by category

## 🆘 Need Help?

- **Setup Issues**: Check `SETUP.md`
- **Architecture**: Check `OPTION1_GUIDE.md`
- **Quick Start**: Check `QUICKSTART.md`
- **Vercel Docs**: https://vercel.com/docs

## 🎉 You're Ready!

Once you've completed the setup:
1. ✅ Vercel Blob Storage created
2. ✅ Vercel Postgres created
3. ✅ Environment variables set
4. ✅ Database migrated
5. ✅ Server running

**Start uploading videos at**: http://localhost:3000/admin

**View videos at**: http://localhost:3000

