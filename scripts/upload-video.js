#!/usr/bin/env node

/**
 * Standalone script to upload a video directly to Vercel Blob Storage
 * 
 * Usage:
 *   node scripts/upload-video.js /path/to/your/video.mp4
 * 
 * Or with pnpm:
 *   pnpm tsx scripts/upload-video.js /path/to/your/video.mp4
 */

const { put } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");

async function uploadVideo(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  // Check for BLOB_READ_WRITE_TOKEN
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("❌ BLOB_READ_WRITE_TOKEN environment variable is not set");
    console.error("\n💡 Set it with:");
    console.error("   export BLOB_READ_WRITE_TOKEN=your_token_here");
    console.error("\n   Or create a .env.local file with:");
    console.error("   BLOB_READ_WRITE_TOKEN=your_token_here");
    process.exit(1);
  }

  try {
    console.log(`📤 Uploading: ${filePath}`);
    console.log("⏳ Please wait...\n");

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    console.log(`   File: ${fileName}`);
    console.log(`   Size: ${fileSizeMB} MB\n`);

    // Upload to Vercel Blob
    const blob = await put(fileName, fileBuffer, {
      access: "public",
      contentType: "video/mp4",
      token: token,
    });

    console.log("✅ Upload successful!\n");
    console.log("📋 Blob URL:");
    console.log(`   ${blob.url}\n`);
    console.log("💡 Copy this URL and use it to update your video in:");
    console.log("   components/video-homepage.tsx (lines 52 and 253)\n");

    // Try to copy to clipboard (optional)
    try {
      const { execSync } = require("child_process");
      if (process.platform === "darwin") {
        execSync(`echo "${blob.url}" | pbcopy`);
        console.log("📋 URL copied to clipboard!\n");
      } else if (process.platform === "linux") {
        execSync(`echo "${blob.url}" | xclip -selection clipboard`);
        console.log("📋 URL copied to clipboard!\n");
      }
    } catch (e) {
      // Clipboard copy failed, that's okay
    }

    return blob.url;
  } catch (error) {
    console.error("❌ Upload failed:");
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes("token")) {
      console.error("💡 Make sure your BLOB_READ_WRITE_TOKEN is correct");
      console.error("   Get it from: Vercel Dashboard → Storage → Blob → Settings → Tokens\n");
    }
    
    process.exit(1);
  }
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error("❌ Please provide a video file path");
  console.error("\nUsage:");
  console.error("   node scripts/upload-video.js /path/to/your/video.mp4");
  console.error("\nOr with pnpm:");
  console.error("   pnpm tsx scripts/upload-video.js /path/to/your/video.mp4");
  process.exit(1);
}

uploadVideo(filePath).catch(console.error);



