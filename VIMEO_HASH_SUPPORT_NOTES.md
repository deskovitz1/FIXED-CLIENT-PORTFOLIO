# Vimeo Hash Support - Unlisted Videos

## Overview

This project now supports both **public** and **unlisted** Vimeo videos. Unlisted videos require a hash parameter in the player URL to play correctly.

## What Changed

### Database Schema
- Added `vimeo_hash` field to `Video` model in Prisma schema
- Field is optional (`String?`) and can be `null` for public videos

### Components Updated
1. **VimeoPlayer** (`components/VimeoPlayer.tsx`)
   - Now accepts `hash?: string | null` prop
   - Builds player URL with `?h={hash}` when hash is provided
   - Public videos: `https://player.vimeo.com/video/{id}?title=0&byline=0&portrait=0`
   - Unlisted videos: `https://player.vimeo.com/video/{id}?h={hash}&title=0&byline=0&portrait=0`

2. **VideoPlayer** (`components/video-player.tsx`)
   - Passes `video.vimeo_hash` to VimeoPlayer component

3. **Admin Forms** (`components/video-homepage.tsx`)
   - Added `vimeo_hash` input field in both FeaturedVideoItem and VideoItem edit forms
   - Added URL parsing helper that extracts both ID and hash from full Vimeo URLs
   - Form auto-populates hash when pasting unlisted video URL

### API Routes Updated
1. **PATCH /api/videos/[id]** (`app/api/videos/[id]/route.ts`)
   - Accepts `vimeo_hash` in request body
   - Passes `vimeo_hash` to `updateVideo()` function

2. **POST /api/videos/create-from-blob** (`app/api/videos/create-from-blob/route.ts`)
   - Accepts `vimeo_hash` in request body
   - Passes `vimeo_hash` to `createVideo()` function

### Database Functions Updated
- `lib/db.ts`:
  - `Video` interface includes `vimeo_hash: string | null`
  - `getVideos()` includes `vimeo_hash` in returned videos
  - `getVideoById()` includes `vimeo_hash` in returned video
  - `createVideo()` accepts and saves `vimeo_hash`
  - `updateVideo()` accepts and updates `vimeo_hash`

### Helper Functions
- `lib/vimeo-url-parser.ts` (NEW)
  - `parseVimeoUrl()` function extracts video ID and hash from Vimeo URLs
  - Supports formats:
    - `https://vimeo.com/123456789` (public)
    - `https://vimeo.com/123456789/ab8ee4cce4` (unlisted)
    - `https://player.vimeo.com/video/123456789`
    - `123456789` (just ID)

## How to Use

### Adding a Public Video

**Option 1: Paste Full URL**
1. Go to admin panel (`/admin`)
2. Click "Add Video"
3. In "Vimeo URL or ID" field, paste: `https://vimeo.com/123456789`
4. The form will auto-extract the ID: `123456789`
5. Leave "Vimeo Hash" field empty
6. Click "Upload Video"

**Option 2: Enter Just ID**
1. In "Vimeo URL or ID" field, enter: `123456789`
2. Leave "Vimeo Hash" field empty
3. Click "Upload Video"

### Adding an Unlisted Video

**Option 1: Paste Full URL (Recommended)**
1. Go to admin panel (`/admin`)
2. Click "Add Video"
3. In "Vimeo URL or ID" field, paste: `https://vimeo.com/123456789/ab8ee4cce4`
4. The form will auto-extract:
   - ID: `123456789`
   - Hash: `ab8ee4cce4`
5. Both fields will be populated automatically
6. Click "Upload Video"

**Option 2: Enter Manually**
1. In "Vimeo URL or ID" field, enter: `123456789`
2. In "Vimeo Hash" field, enter: `ab8ee4cce4`
3. Click "Upload Video"

### Editing an Existing Video

1. Go to admin panel (`/admin`)
2. Find the video you want to edit
3. Click the **Edit** button (pencil icon)
4. Update "Vimeo URL or ID" and/or "Vimeo Hash" fields
5. Click **Save**

### Where to Find the Hash

For unlisted videos, the hash is the part after the video ID in the Vimeo URL:

```
https://vimeo.com/123456789/ab8ee4cce4
                          ^^^^^^^^^^^^
                          This is the hash
```

**How to get the hash:**
1. Upload video to Vimeo
2. Set video privacy to "Unlisted"
3. Copy the share URL (will include the hash)
4. The hash is the alphanumeric string after the last `/` in the URL

## Technical Details

### Player URL Construction

**Public Video:**
```
https://player.vimeo.com/video/123456789?title=0&byline=0&portrait=0
```

**Unlisted Video:**
```
https://player.vimeo.com/video/123456789?h=ab8ee4cce4&title=0&byline=0&portrait=0
```

The `h` parameter is added to the query string when `vimeo_hash` is present and non-empty.

### Database Storage

- `vimeo_id`: Stores the numeric video ID (e.g., `"123456789"`)
- `vimeo_hash`: Stores the hash for unlisted videos (e.g., `"ab8ee4cce4"`)
- Both fields are optional and can be `null`
- If `vimeo_id` is `null`, the video will use blob storage instead

### Validation

- Videos can have:
  - Both `vimeo_id` and `vimeo_hash` (unlisted Vimeo video)
  - Only `vimeo_id` (public Vimeo video)
  - Neither (uses blob storage)
- Hash is optional even when `vimeo_id` is present (public video)
- If hash is provided but empty string, it's treated as `null`

## Files Changed

1. `prisma/schema.prisma` - Added `vimeo_hash` field
2. `lib/db.ts` - Updated Video interface and all CRUD functions
3. `components/VimeoPlayer.tsx` - Added hash prop and URL building
4. `components/video-player.tsx` - Passes hash to VimeoPlayer
5. `components/video-homepage.tsx` - Added hash input fields and URL parsing
6. `app/api/videos/[id]/route.ts` - Handles hash in PATCH requests
7. `app/api/videos/create-from-blob/route.ts` - Handles hash in POST requests
8. `lib/vimeo-url-parser.ts` - NEW: URL parsing helper function

## Testing Checklist

- [x] Public video with only `vimeo_id` plays correctly
- [x] Unlisted video with both `vimeo_id` and `vimeo_hash` plays correctly
- [x] Admin form auto-extracts hash from full URL
- [x] Admin form saves hash correctly
- [x] Editing video shows saved hash value
- [x] Player builds correct URL with hash parameter

## Summary

The site now fully supports unlisted Vimeo videos. When adding an unlisted video:
1. Paste the full Vimeo URL (includes hash)
2. The form auto-extracts both ID and hash
3. Video plays correctly with the hash parameter

For public videos, continue using just the video ID - hash is not needed.

