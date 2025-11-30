# Core Capabilities - Maintained Features

This document lists all core capabilities that must be maintained regardless of other changes.

## ⚠️ **IMPORTANT: Working Upload Version**
**If upload breaks, restore from commit `459c2ed`**  
See `UPLOAD_WORKING_VERSION.md` for detailed restoration instructions.

## ✅ Video Upload System
- **Location**: `components/video-homepage.tsx` - `handleAddVideo` function
- **API Routes**: 
  - `/api/blob-upload` - Handles client-side blob upload tokens
  - `/api/videos/create-from-blob` - Saves video metadata after upload
- **Features**:
  - Direct client-to-Vercel Blob upload (bypasses serverless function limits)
  - Live upload progress bar with percentage
  - Real-time MB/s speed display
  - MB uploaded / MB total display
  - Cancel upload functionality
  - Supports large files (500MB+)
- **Key Dependencies**: `@vercel/blob/client` `upload()` function

## ✅ Video Edit & Delete on Videos Page
- **Location**: `components/video-homepage.tsx` - `FeaturedVideoItem` and `VideoItem` components
- **API Routes**: 
  - `PATCH /api/videos/[id]` - Updates video title, description, category
  - `DELETE /api/videos/[id]` - Deletes video from database
- **Features**:
  - Inline editing of video title and description
  - Category selection dropdown
  - Save/Cancel buttons
  - Delete button with confirmation
  - Auto-refresh after edit/delete

## ✅ Database Functions (Robust Error Handling)
- **Location**: `lib/db.ts`
- **Functions**:
  - `updateVideo()` - Handles schema mismatches with raw SQL fallback
  - `deleteVideo()` - Handles schema mismatches with raw SQL fallback
  - `createVideo()` - Handles missing columns gracefully
  - `getVideos()` - Filters by visibility and category
- **Features**:
  - Prisma-first approach with raw SQL fallback
  - Handles missing columns (`display_date`, `is_visible`) gracefully
  - Normalized response format matching `Video` interface

## ✅ Menu & Circle Page Swap
- **Main Menu**: `/menu` - Circle video selector with spinning wheel and CRT TV
- **Old Menu**: `/circle-video-test` - Original circus menu with interactive letters
- **Navigation**: Links between pages maintained

## ✅ Video Player
- **Location**: `components/video-player.tsx`
- **Features**:
  - Fullscreen modal video player
  - Title overlay (non-blocking)
  - Description below video
  - Controls accessible

## ✅ Splash Page
- **Location**: `app/page.tsx`
- **Features**:
  - Splash video (200% size)
  - Click to enter video
  - Auto-transition to menu
  - Skip buttons

## 🔧 Maintenance Notes

### Upload Feature
- Uses `@vercel/blob/client` `upload()` with `multipart: true` for large files
- Progress tracking via `onUploadProgress` callback
- Cancel via `AbortController`
- Form reset handled via `useRef` for reliability

### Database Updates
- Always try Prisma first
- Fall back to raw SQL if schema mismatch detected
- Normalize all responses to match `Video` interface
- Handle `display_date` and `is_visible` as optional fields

### Error Handling
- All database operations have try/catch with fallbacks
- User-friendly error messages
- Console logging for debugging
- Graceful degradation when columns missing

## 📦 Key Dependencies
- `@vercel/blob/client` - Client-side blob uploads
- `@prisma/client` - Database ORM
- `next/navigation` - Routing
- `lucide-react` - Icons

## 🚫 Do Not Remove
- Upload functionality in `video-homepage.tsx`
- Edit/Delete functionality in `FeaturedVideoItem` and `VideoItem`
- Database fallback logic in `lib/db.ts`
- API routes: `/api/blob-upload`, `/api/videos/create-from-blob`, `/api/videos/[id]`
- Menu/Circle page routes and navigation

