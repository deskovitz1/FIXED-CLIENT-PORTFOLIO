# Vimeo Upload Guide

## ✅ What Changed

You can now upload videos using **ONLY a Vimeo ID** - no file upload required!

## How to Upload a Video Using Vimeo ID

### Option 1: Vimeo Only (No File Upload)
1. Go to admin panel (`/admin`)
2. Click "Add Video"
3. **Leave "Video File" empty** (it's now optional)
4. Enter **Title** (required)
5. Enter **Vimeo ID** (e.g., `1143278084`)
6. Optionally add description, category
7. Click "Upload Video"
8. ✅ Video is saved and will play from Vimeo!

### Option 2: File Upload (Traditional)
1. Go to admin panel (`/admin`)
2. Click "Add Video"
3. Select a video file
4. Enter **Title** (required)
5. Leave Vimeo ID empty
6. Click "Upload Video"
7. ✅ Video is uploaded to blob storage and plays from there

### Option 3: Both (File + Vimeo ID)
- You can upload a file AND provide a Vimeo ID
- The video will play from **Vimeo** (Vimeo takes priority)
- The blob file is still stored but not used for playback

## How It Works

### Video Player Logic:
- **If video has `vimeo_id`**: Uses Vimeo Player (iframe)
- **If video has NO `vimeo_id`**: Uses blob URL video player (original behavior)

### Database:
- Videos with Vimeo ID: `vimeo_id` field is set, `blob_url` may be empty/placeholder
- Videos without Vimeo ID: `blob_url` is set, `vimeo_id` is null

## Getting Your Vimeo ID

1. Go to your video on Vimeo
2. Copy the URL (e.g., `https://vimeo.com/1143278084`)
3. Extract the number: `1143278084`
4. Paste that number into the "Vimeo ID" field

## Important Notes

⚠️ **Database Migration Required:**
Before you can save Vimeo IDs, run:
```bash
pnpm db:generate
pnpm db:push
```

✅ **Validation:**
- You need **either** a video file **OR** a Vimeo ID (at least one)
- Title is always required
- Everything else is optional

✅ **Priority:**
- If both file and Vimeo ID are provided, Vimeo is used for playback
- The uploaded file is still stored but not used

## Troubleshooting

**"Failed to save" error:**
- Make sure you ran `pnpm db:push` to add the `vimeo_id` column
- Check that you provided either a file OR Vimeo ID

**Video doesn't play from Vimeo:**
- Verify the Vimeo ID is correct (numeric only)
- Make sure the video is public on Vimeo
- Check browser console for errors

**Video file is still required:**
- Make sure you're using the latest code
- Refresh the page and try again
- The file input should say "optional if using Vimeo ID"

