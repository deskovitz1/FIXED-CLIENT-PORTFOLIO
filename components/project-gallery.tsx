"use client"

import { useState, useRef } from "react"
import { PhotoLightbox } from "@/components/photo-lightbox"
import { useScrollComposition } from "@/hooks/use-scroll-composition"
import type { ProjectPhoto } from "@/lib/projects/featured"

export function ProjectGallery({ photos, title }: { photos: ProjectPhoto[]; title: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)
  useScrollComposition(ref, "figure")
  if (!photos.length) return null
  return <section ref={ref} className="project-gallery" aria-label={`${title} behind the scenes`}>
    {photos.map((photo, i) => <figure key={photo.src}><button className="photo-open" aria-label={`View ${title} photo ${i + 1}`} onClick={() => setSelected(i)}><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" /></button></figure>)}
    {selected !== null && <PhotoLightbox photos={photos} initialIndex={selected} title={title} onClose={() => setSelected(null)} />}
  </section>
}
