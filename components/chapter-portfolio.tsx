"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import type { Video } from "@/lib/db"
import { PostcardVideo } from "@/components/postcard-video"
import { PhotoLightbox } from "@/components/photo-lightbox"
import { FilmScreen } from "@/components/film-screen"
import { pageAdvance } from "@/lib/projects/transition"
import type { EditorialImage } from "@/lib/projects/chapters"
import { STILLS_FOLDERS } from "@/lib/projects/stills-folders"
import { projectDisplayTitle } from "@/lib/projects/display-title"
import { chapterFor } from "@/lib/projects/chapters"
import "@/styles/chapter-portfolio.css"

// These chapters go directly from their film to the next project, without a contact sheet.
const VIDEO_ONLY_PROJECTS = new Set([40, 30, 19, 29, 15, 1, 32, 31])

export function ChapterPortfolio({ videos, onSelect }: { videos: Video[]; onSelect: (video: Video) => void }) {
  const [stills, setStills] = useState<Record<string, {preview: (EditorialImage & {focalPoint?:string})[]; gallery: EditorialImage[]; postcards?: EditorialImage[]}>>({})
  useEffect(() => { const controller = new AbortController(); fetch("/api/project-stills", {signal:controller.signal}).then(r=>r.ok?r.json():{}).then(data => { setStills(data); setStillsLoaded(true) }).catch(()=>{}); return ()=>controller.abort() }, [])
  const [stillsLoaded, setStillsLoaded] = useState(false)
  const [viewer, setViewer] = useState<{photos: EditorialImage[]; index: number; title: string} | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const chapters = useMemo(() => [...videos].sort((a,b) => {
    // Change only the scroll presentation; never reorder the shared video list.
    const galleryOrder = Number(VIDEO_ONLY_PROJECTS.has(a.id)) - Number(VIDEO_ONLY_PROJECTS.has(b.id))
    if (galleryOrder) return galleryOrder
    const rank = (id: number) => id === 43 ? -2 : id === 41 ? -1 : 0
    return rank(a.id) - rank(b.id)
  }).map(video => ({ video: {...video, title:projectDisplayTitle(video)}, ...chapterFor(video) })), [videos])
  useEffect(() => {
    const node = root.current
    if (!node) return
    const surface = node.closest<HTMLElement>(".portfolio-surface") || node
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const update = () => {
      frame = 0
      let color = [250,250,248]
      if (!reduced.matches) {
        const sections = [...node.querySelectorAll<HTMLElement>(".film-chapter")]
        sections.forEach((section, index) => {
          const top = section.getBoundingClientRect().top
          const { progress:t, eased } = pageAdvance(top, innerHeight)
          section.style.setProperty("--page-advance", String(index === 0 ? 1 : eased))
          section.style.setProperty("--chapter-pin", `${Math.min(145, innerHeight - section.offsetHeight)}px`)
          if (!t) return
          const target = chapters[index].palette
          color = color.map((channel, i) => channel + (target[i]-channel)*eased)
        })
      }
      surface.style.setProperty("--archive-paper", `rgb(${color.map(Math.round).join(",")})`)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = new ResizeObserver(schedule)
    resize.observe(node)
    window.addEventListener("scroll", schedule, { passive:true })
    window.addEventListener("resize", schedule)
    reduced.addEventListener("change", schedule)
    update()
    return () => { cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); reduced.removeEventListener("change", schedule); surface.style.removeProperty("--archive-paper") }
  }, [chapters])
  return <div ref={root} className="chapter-portfolio">
    {chapters.map(({video, images}, index) => {
      const slug = STILLS_FOLDERS[video.id] || ""
      const supplied = stills[slug]
      const source = supplied?.preview.length ? supplied.preview : supplied?.gallery.length ? supplied.gallery : images
      // Never repeat an image to fill the contact sheet or fullscreen sequence.
      const filename = (src: string) => src.split("/").pop()
      const unique = (items: EditorialImage[]) => items.filter((item,i) => items.findIndex(other => filename(other.src) === filename(item.src)) === i)
      const photos = unique(source)
      const postcards = unique(supplied?.postcards || [])
      const postcardSlots = [0, 2, 4, 6, 8]
      const gallery: (EditorialImage | null)[] = Array(video.id === 11 ? 6 : 9).fill(null)
      postcards.slice(0,5).forEach((clip,i) => { if (postcardSlots[i] < gallery.length) gallery[postcardSlots[i]] = clip })
      let photoIndex = 0
      gallery.forEach((image,i) => { if (!image && photoIndex < photos.length) gallery[i] = photos[photoIndex++] })
      const fullPhotos = unique([...(supplied?.gallery.length ? supplied.gallery : source), ...photos.slice(0,9)])
      // Spread the complete postcard collection through the fullscreen sequence.
      postcards.forEach((clip,i) => fullPhotos.splice(Math.min(i * 3 + 2, fullPhotos.length),0,clip))
      return <Fragment key={video.id}><span data-film-anchor={video.id} data-film-title={video.title} aria-hidden="true" style={{display:"block",height:0}} /><article id={`film-${video.id}`} className="film-chapter" aria-label={video.title} style={{zIndex:index+1}}>
        <div className="film-page-surface">
          <FilmScreen video={video} eager={index === 0} />
          {video.id === 42 && <a className="film-feature-link" href="https://frameset.app/search/brand/second-sight-ventures/the-moat" target="_blank" rel="noopener noreferrer" aria-label="Featured on Frame Set — check it out (opens in a new tab)">
            <span className="film-feature-heading">FEATURED ON FRAME SET</span>
            <span className="film-feature-action">CHECK IT OUT <span aria-hidden="true">↗</span></span>
          </a>}
          {!VIDEO_ONLY_PROJECTS.has(video.id) && (!stillsLoaded || gallery.some(Boolean)) && <section className="film-stills" aria-label={`${video.title} stills`}>
            {stillsLoaded && gallery.map((image,i)=>image ? <figure key={`${image.src}-${i}`} style={{gridArea:`${Math.floor(i / 3) + 1} / ${i % 3 + 1}`}}>
              <button className="photo-open" aria-label={`View ${video.title} photo ${i + 1}`} onClick={() => setViewer({photos:fullPhotos, index:Math.max(0,fullPhotos.findIndex(photo => filename(photo.src) === filename(image.src))), title:video.title})}>{image.kind === "video" ? <PostcardVideo src={image.previewSrc || image.src} mobileSrc={image.mobileSrc} label={image.alt} /> : <img src={image.previewSrc || image.src} srcSet={image.mobileSrc ? `${image.mobileSrc} 480w, ${image.previewSrc || image.src} 1280w` : undefined} sizes="33vw" alt={image.alt} width={image.width} height={image.height} loading={index === 0 ? "eager" : "lazy"} decoding="async" style={{objectPosition:(image as EditorialImage & {focalPoint?:string}).focalPoint || "50% 50%"}} />}</button>
              {image.temporary && <figcaption>Temporary film image</figcaption>}
            </figure> : null)}
          </section>}
        </div>
      </article></Fragment>
    })}
    {viewer && <PhotoLightbox photos={viewer.photos} initialIndex={viewer.index} title={viewer.title} onClose={() => setViewer(null)} />}
  </div>
}
