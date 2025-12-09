import { NextResponse } from 'next/server'
import { verifyVimeoConnection } from '@/lib/vimeo'

/**
 * Vimeo Verification Route
 * 
 * GET /api/vimeo/verify
 * 
 * Verifies that Vimeo API connection is working correctly.
 * Useful for debugging and health checks.
 */
export async function GET() {
  try {
    const result = await verifyVimeoConnection()
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

