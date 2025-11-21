#!/usr/bin/env tsx

/**
 * Standalone script to upload a video directly to Vercel Blob Storage
 * 
 * Usage:
 *   pnpm tsx scripts/upload-video.ts /path/to/your/video.mp4
 */

import { put } from "@vercel/blob";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function uploadVideo(filePath: string) {
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
    console.error("\n   Then run: pnpm tsx scripts/upload-video.ts /path/to/video.mp4");
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
    console.log("💡 Copy this URL and share it with me to update your video in:");
    console.log("   components/video-homepage.tsx (lines 52 and 253)\n");

    // Try to copy to clipboard (optional)
    try {
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
  } catch (error: any) {
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
  console.error("   pnpm tsx scripts/upload-video.ts /path/to/your/video.mp4");
  console.error("\nExample:");
  console.error("   pnpm tsx scripts/upload-video.ts ~/Downloads/my-video.mp4");
  process.exit(1);
}

uploadVideo(filePath).catch(console.error);

