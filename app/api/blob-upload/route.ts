import { NextResponse } from 'next/server';
import {
  handleUpload,
  type HandleUploadBody,
} from '@vercel/blob/client';

// Enforce Blob token is set - fail loudly if missing
const token =
  process.env.CIRCUS_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  throw new Error("Missing Blob token");
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Allow video uploads
        return {
          allowedContentTypes: [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
            'video/*',
          ],
          // Ensure filenames don't collide
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            // Optional data you want back on onUploadCompleted later
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Log upload completion
        console.log('✅ Blob upload completed:', {
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('❌ blob handleUpload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload token error' },
      { status: 400 },
    );
  }
}

