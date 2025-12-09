# Vimeo Admin Fix - Complete End-to-End Debug & Fix

## Problem Summary

The admin UI was not persisting `vimeo_id` for videos, and the public page was showing "No Vimeo ID" even after saving a Vimeo ID.

## Root Causes Found

### 1. **`getVideos()` Not Including `vimeo_id`**
   - **Issue**: `getVideos()` was using Prisma's `findMany()` which might not include `vimeo_id` if the Prisma client wasn't regenerated after adding the column
   - **Symptom**: `/api/videos` list returned `vimeo_id: null` even though `/api/videos/39` returned `vimeo_id: "1143278084"`
   - **Fix**: Changed `getVideos()` to use raw SQL (`SELECT * FROM videos`) instead of Prisma's `findMany()` to ensure `vimeo_id` is always included

### 2. **`getVideoById()` Missing `vimeo_id` in Return**
   - **Issue**: `getVideoById()` was using spread operator which might not include `vimeo_id`
   - **Fix**: Changed to explicit field mapping to ensure `vimeo_id` is always included

### 3. **`updateVideo()` Missing `vimeo_id` in Return**
   - **Issue**: `updateVideo()` was not including `vimeo_id` in the returned Video object
   - **Fix**: Added `vimeo_id` and `sort_order` to the returned Video object

### 4. **Form State Not Updating After Save**
   - **Issue**: After saving, form updated `displayDate` but not `vimeoId` state
   - **Fix**: Added code to update `vimeoId` state from server response after save

### 5. **Form State Not Syncing on Edit**
   - **Issue**: When editing started, form state wasn't syncing from video prop
   - **Fix**: Added `useEffect` hooks to sync form state when editing starts

### 6. **API Response Caching**
   - **Issue**: `/api/videos` endpoint had aggressive caching (1 year) which could serve stale data
   - **Fix**: Temporarily disabled caching during migration (can re-enable later)

## Files Changed

### 1. `lib/db.ts`
**Changes**:
- **`getVideos()`**: Changed from Prisma `findMany()` to raw SQL to ensure `vimeo_id` is always included
- **`getVideoById()`**: Changed from spread operator to explicit field mapping including `vimeo_id`
- **`updateVideo()`**: Added `vimeo_id` and `sort_order` to returned Video object
- **Added logging**: Log `vimeo_id` values when fetching videos

### 2. `components/video-homepage.tsx`
**Changes**:
- **FeaturedVideoItem**: 
  - Added `useEffect` to sync form state when editing starts
  - Added code to update `vimeoId` state after successful save
- **VideoItem**: 
  - Added `useEffect` to sync form state when editing starts
  - Added code to update `vimeoId` state after successful save
- **Added logging**: Log `vimeo_id` in debug logs and when selecting videos

### 3. `components/video-player.tsx`
**Changes**:
- **Added logging**: Log `vimeo_id` when video player opens

### 4. `app/api/videos/route.ts`
**Changes**:
- **Disabled caching**: Temporarily disabled aggressive caching to ensure fresh data during migration
- **Added logging**: Log `vimeo_id` values for debugging

### 5. `app/api/videos/debug/route.ts` (NEW)
**Purpose**: Debug endpoint to inspect video records
- `GET /api/videos/debug?id=39` - Get specific video with debug info
- `GET /api/videos/debug` - Get first video with debug info

## Verification Steps

### Test Flow (Now Works):
1. ✅ **Create/Edit Video in Admin**:
   - Go to `/admin`
   - Create new video OR edit existing video (e.g., ID 39)
   - Enter Vimeo ID: `1143278084`
   - Click Save
   - ✅ Vimeo ID is saved to database

2. ✅ **Re-open Video in Admin**:
   - Click Edit on the same video
   - ✅ Vimeo ID field shows `1143278084` (saved value)

3. ✅ **Public Page**:
   - Navigate to public site
   - Click on the video
   - ✅ Vimeo iframe appears and plays
   - ✅ "No Vimeo ID" error does NOT appear

### Debug Endpoints:
- `GET /api/videos/debug?id=39` - Check if video has `vimeo_id`
- `GET /api/videos` - Check if `vimeo_id` is in list response

## How to Add/Edit Videos with Vimeo IDs

### Adding a New Video:

**Option 1: Vimeo Only (No File Upload)**
1. Go to admin panel (`/admin`)
2. Click "Add Video"
3. Leave "Video File" empty
4. Enter **Title** (required)
5. Enter **Vimeo ID** (e.g., `1143278084`)
6. Optionally add description, category
7. Click "Upload Video"
8. ✅ Video is saved with `vimeo_id` and plays from Vimeo

**Option 2: File + Vimeo ID**
1. Go to admin panel (`/admin`)
2. Click "Add Video"
3. Upload a video file (optional backup)
4. Enter **Title** (required)
5. Enter **Vimeo ID** (e.g., `1143278084`)
6. Click "Upload Video"
7. ✅ Video plays from Vimeo (file stored as backup)

### Editing an Existing Video:

1. Go to admin panel (`/admin`)
2. Find the video you want to edit
3. Click the **Edit** button (pencil icon)
4. Enter or update **Vimeo ID** field
5. Click **Save**
6. ✅ Vimeo ID is saved and video plays from Vimeo

### Getting Your Vimeo ID:

1. Upload video to Vimeo
2. Copy the URL (e.g., `https://vimeo.com/1143278084`)
3. Extract the number: `1143278084`
4. Paste that number into the "Vimeo ID" field

## End-to-End Data Flow (Now Working)

```
1. Admin Form
   ↓ (user enters vimeo_id)
2. Form State (vimeoId)
   ↓ (on save)
3. PATCH /api/videos/{id}
   ↓ (extracts vimeo_id from body)
4. updateVideo() in lib/db.ts
   ↓ (saves to database)
5. Database (videos.vimeo_id = "1143278084")
   ↓ (returns Video object with vimeo_id)
6. Form updates state from response
   ↓ (onChanged() refreshes list)
7. GET /api/videos
   ↓ (calls getVideos())
8. getVideos() uses raw SQL
   ↓ (SELECT * FROM videos - includes vimeo_id)
9. Front-end receives videos with vimeo_id
   ↓ (user clicks video)
10. VideoPlayer component
    ↓ (checks video.vimeo_id)
11. VimeoPlayer renders iframe
    ↓ (video plays from Vimeo)
```

## Key Fixes Applied

1. ✅ **Database Query**: Changed `getVideos()` to use raw SQL to ensure `vimeo_id` is always included
2. ✅ **Return Values**: Fixed `getVideoById()` and `updateVideo()` to include `vimeo_id` in returned objects
3. ✅ **Form State**: Fixed form components to sync and update `vimeoId` state correctly
4. ✅ **Caching**: Disabled aggressive caching during migration
5. ✅ **Logging**: Added comprehensive logging to track `vimeo_id` through the flow

## Testing Checklist

- [x] Create video with Vimeo ID → Saves correctly
- [x] Edit video and add Vimeo ID → Saves correctly
- [x] Re-open edited video → Vimeo ID field shows saved value
- [x] Public page → Video plays from Vimeo (not "No Vimeo ID" error)
- [x] `/api/videos` list → Includes `vimeo_id` for all videos
- [x] `/api/videos/{id}` → Includes `vimeo_id` for single video

## Summary

All CRUD operations for `vimeo_id` are now working end-to-end:
- ✅ **CREATE**: `vimeo_id` saved when creating videos
- ✅ **READ**: `vimeo_id` included in all Video objects
- ✅ **UPDATE**: `vimeo_id` saved and returned correctly
- ✅ **DELETE**: Works as expected

The admin UI now properly persists `vimeo_id`, and the public page correctly plays videos from Vimeo when `vimeo_id` is set! 🎉

