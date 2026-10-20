import { Suspense } from "react"
import { ContinuousExperience } from "@/components/continuous-experience"

export default function MenuPage() {
  return <>
    <link rel="preload" as="image" href="/videos/director-reel-poster.jpg" media="(min-width: 768px)" />
    <Suspense fallback={null}><ContinuousExperience /></Suspense>
  </>
}
