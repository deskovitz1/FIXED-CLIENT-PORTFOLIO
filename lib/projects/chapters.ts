import type { Video } from "@/lib/db"
import { getVideoThumbnail } from "@/lib/utils"
import { FEATURED_PROJECTS } from "./featured"

export type EditorialImage = {
  src: string; previewSrc?: string; mobileSrc?: string; alt: string; caption?: string; width: number; height: number
  composition: "landscape" | "left" | "right" | "spread" | "archive"
  kind?: "image" | "video"
  motion?: boolean
  temporary?: boolean
}
export type ChapterSettings = {
  palette: [number, number, number]
  rhythm: "structured" | "open"
  year?: string
  credits?: { role: string; name: string }[]
  images?: EditorialImage[]
}
// Palettes follow the amber excavation footage and the red-room CIRCUS stills.
// Other films remain neutral until their individual art direction is curated.
export const CHAPTER_SETTINGS: Record<number, ChapterSettings> = {
  43: { palette: [209, 191, 164], rhythm: "structured" },
  41: { palette: [184, 125, 112], rhythm: "open" },
}

export function chapterFor(video: Video): ChapterSettings & { images: EditorialImage[] } {
  const settings = CHAPTER_SETTINGS[video.id] || { palette: [250, 250, 248] as [number, number, number], rhythm: "structured" as const }
  if (settings.images) return { ...settings, images: settings.images }
  const photos = FEATURED_PROJECTS.find(project => project.id === video.id)?.photos || []
  const compositions: EditorialImage["composition"][] = ["landscape", "left", "right", "spread", "archive"]
  if (photos.length) return { ...settings, images: photos.map((photo, index) => ({ ...photo, composition: compositions[index % compositions.length], motion: index === 0 || index === 3, caption: photo.src.includes("excavation-wide") ? "FILM STILL" : "BEHIND THE SCENES" })) }
  const src = getVideoThumbnail(video)
  const placements: EditorialImage["composition"][] = video.id === 41 ? ["left", "right", "spread", "archive"] : ["left", "right"]
  return { ...settings, images: src ? placements.map(composition => ({ src, alt: `${video.title} — existing film image used as a temporary editorial placement`, width: 1600, height: 900, composition, temporary: true, motion: composition === "spread", caption: "TEMPORARY PLACEMENT / FILM IMAGE" })) : [] }
}
