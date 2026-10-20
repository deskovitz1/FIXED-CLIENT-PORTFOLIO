import { Suspense } from "react"
import { ContinuousExperience } from "@/components/continuous-experience"

// Preserve bookmarked portfolio URLs within the same continuous experience.
export default function VideosPage() {
  return <Suspense fallback={null}><ContinuousExperience initialSection="work" /></Suspense>
}
