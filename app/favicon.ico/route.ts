// No favicon is part of the approved design. Answer the browser's automatic
// request without a missing-resource error or introducing a new graphic.
export const dynamic = "force-static"

export function GET() {
  return new Response(null, { status: 204 })
}
