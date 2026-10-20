export type ProjectPhoto = {
  src: string
  alt: string
  width: number
  height: number
  layout: "wide" | "left" | "right" | "inset"
}

export const FEATURED_PROJECTS: { id: number; slug: string; photos: ProjectPhoto[] }[] = [
  {
    id: 43,
    slug: "neogenesis",
    photos: [
      { src: "/projects/neogenesis/excavation-wide.jpg", alt: "Wide view of the excavation scene in amber light and haze", width: 2000, height: 1229, layout: "wide" },
      { src: "/projects/neogenesis/vessel-take.jpg", alt: "Camera operator filming a kneeling performer examining a vessel in amber light and haze", width: 2000, height: 1325, layout: "wide" },
      { src: "/projects/neogenesis/monitor-detail.jpg", alt: "A production monitor frames the performer against the amber-lit excavation set", width: 2000, height: 1329, layout: "left" },
      { src: "/projects/neogenesis/overhead-camera.jpg", alt: "Overhead view of the camera operator filming the performer in the excavation", width: 2000, height: 1323, layout: "right" },
      { src: "/projects/neogenesis/set-wide.jpg", alt: "Wide view of the NEOGENESIS set with crew, performer and production monitor", width: 2000, height: 1346, layout: "inset" },
    ],
  },
  { id: 41, slug: "circus-video", photos: [] },
]
