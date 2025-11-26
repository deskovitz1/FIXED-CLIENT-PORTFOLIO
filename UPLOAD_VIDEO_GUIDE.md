# Upload Video Directly to Blob Storage

Since the admin page isn't working yet, use this script to upload your video directly.

## Quick Start

1. **Make sure you have your blob token set**:
   ```bash
   # Check if it's set
   echo $BLOB_READ_WRITE_TOKEN
   
   # If not set, create .env.local file:
   # BLOB_READ_WRITE_TOKEN=your_token_here
   ```

2. **Upload your video**:
   ```bash
   pnpm upload-video /path/to/your/video.mp4
   ```

   Example:
   ```bash
   pnpm upload-video ~/Downloads/intro-video-shortened.mp4
   ```

3. **Copy the blob URL** that gets printed and share it with me!

## Detailed Steps

### Step 1: Get Your Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** → **Blob**
4. Click on your blob store
5. Go to **Settings** → **Tokens**
6. Copy the token (starts with `vercel_blob_rw_`)

### Step 2: Set the Token

**Option A: Environment Variable (Temporary)**
```bash
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

**Option B: .env.local File (Recommended)**
Create a `.env.local` file in the project root:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

### Step 3: Upload the Video

```bash
# Make sure you're in the project directory
cd /Users/dylaneskovitz/Developer/v0-v37-rebuild-main

# Upload your video (replace with your actual file path)
pnpm upload-video /path/to/your/video.mp4
```

The script will:
- ✅ Check if the file exists
- ✅ Show file size
- ✅ Upload to Vercel Blob Storage
- ✅ Display the blob URL
- ✅ Copy URL to clipboard (on Mac/Linux)

### Step 4: Share the URL

After upload, you'll see something like:
```
✅ Upload successful!

📋 Blob URL:
   https://hebbkx1anhila5yf.public.blob.vercel-storage.com/your-video-abc123.mp4
```

**Copy this URL and share it with me**, and I'll update the code to use it!

## Alternative: Manual Upload via Vercel Dashboard

If the script doesn't work, you can also:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Your Project → **Storage** → **Blob**
3. Click **Upload** button
4. Select your video file
5. Copy the URL after upload

## Troubleshooting

### "BLOB_READ_WRITE_TOKEN is not set"
- Make sure you've created `.env.local` with the token
- Or export it: `export BLOB_READ_WRITE_TOKEN=your_token`

### "File not found"
- Use the full path to your video file
- Example: `~/Downloads/video.mp4` or `/Users/yourname/Downloads/video.mp4`

### Upload fails
- Check your token is correct
- Make sure you have internet connection
- Check file size isn't too large

## What Happens Next?

Once you share the blob URL with me, I'll:
1. Update `components/video-homepage.tsx` with the new URL
2. Replace the old video URL in both places (lines 52 and 253)
3. Commit and push the changes

Then your new video will play on the homepage! 🎉



