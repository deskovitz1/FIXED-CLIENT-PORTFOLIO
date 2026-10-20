import { NextResponse } from "next/server"
import manifest from "@/lib/projects/stills-manifest.json"
import { readProjectStills } from "@/lib/projects/read-stills"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  // Production functions carry only the index, never the actual media files.
  // Development still discovers newly dropped files on refresh.
  const stills = process.env.NODE_ENV === "production" ? manifest : await readProjectStills()
  return NextResponse.json(stills, { headers: { "Cache-Control": "no-store" } })
}
