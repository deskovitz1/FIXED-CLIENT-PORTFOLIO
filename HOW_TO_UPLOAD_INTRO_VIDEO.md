# How to Upload and Update the Intro Video

## Step 1: Upload Your Video to Blob Storage

1. **Go to the Admin Panel**:
   - Open: http://localhost:3000/admin
   - (Or your deployed URL: https://your-domain.vercel.app/admin)

2. **Upload the Video**:
   - Click "Choose File" and select your video file
   - Enter a title (e.g., "Intro Video - Updated")
   - Optionally add a description
   - Click "Upload Video"
   - Wait for the upload to complete

3. **Get the Blob URL**:
   - After upload, the video will appear in the list
   - Open your browser's Developer Tools (F12)
   - Go to the Network tab
   - Refresh the page or check the API response
   - OR: Check the database directly in Vercel Dashboard
   - OR: The URL will be in the format: `https://[your-blob-store].public.blob.vercel-storage.com/[filename]-[hash].mp4`

## Step 2: Find the Blob URL

### Option A: From Admin Panel (Easiest)
After uploading, you can:
1. Check the browser console for the upload response
2. The URL is returned in the API response
3. Or check Vercel Dashboard → Storage → Blob → Your file

### Option B: From Database
1. Go to Vercel Dashboard → Storage → Postgres
2. Open SQL Editor
3. Run: `SELECT blob_url, title FROM videos ORDER BY created_at DESC LIMIT 1;`
4. Copy the `blob_url` value

### Option C: From Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Upload the video
4. Find the POST request to `/api/videos`
5. Check the Response - it contains the `video` object with `blob_url`

## Step 3: Update the Code

Once you have the blob URL, update it in the code:

**File**: `components/video-homepage.tsx`

**Line 253**: Update the video source:
```tsx
<source src="YOUR_NEW_BLOB_URL_HERE" type="video/mp4" />
```

**Line 52**: Also update in the reverse playback section:
```tsx
video.src = "YOUR_NEW_BLOB_URL_HERE"
```

## Quick Method: Check Uploaded Video URL

After uploading, you can quickly get the URL by:

1. **Using Browser Console**:
   ```javascript
   // In browser console on /admin page
   fetch('/api/videos')
     .then(r => r.json())
     .then(data => {
       const latest = data.videos[0];
       console.log('Latest video URL:', latest.blob_url);
       navigator.clipboard.writeText(latest.blob_url);
       console.log('URL copied to clipboard!');
     });
   ```

2. **Or check the upload response**:
   - After clicking "Upload Video", check the browser console
   - The response will show the video object with the `blob_url`

## Alternative: Make it Dynamic (Future Enhancement)

If you want the intro video to be configurable without code changes, we could:
- Store it in an environment variable
- Or create a special "intro-video" category
- Or add a database flag for "is_intro_video"

Let me know if you'd like me to implement this!



