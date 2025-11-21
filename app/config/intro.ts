/**
 * INTRO VIDEO CONFIGURATION
 * 
 * To change the intro video:
 * 1. Upload your new video to Vercel Blob Storage via the admin panel
 * 2. Copy the public blob URL
 * 3. Replace the URL below with your new video URL
 * 
 * Current intro video: "mp4 circus logo"
 * 
 * The intro video is displayed on the root page (/) and:
 * - Shows "CLICK TO ENTER" overlay initially
 * - Plays on click (muted, no autoplay, no loop)
 * - Plays at 1.25x speed (25% faster)
 * - Has a "Skip intro" button that navigates to /videos
 * - Handles AbortError gracefully (no console spam)
 */

export const INTRO_VIDEO_URL =
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/mp4%20circus%20logo-8YUWo7f9uTD2Nc4t14hdsuiOfYgAQe.mp4";

/**
 * Optional: If you want to filter this intro video out of the regular video grid,
 * update the INTRO_VIDEO_FILENAME in lib/db.ts to match your video's filename.
 * 
 * Current filename pattern: "WEBSITE VID heaven"
 */
