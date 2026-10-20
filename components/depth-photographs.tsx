"use client"
import { useEffect, useRef } from "react"
import type { EditorialImage } from "@/lib/projects/chapters"

export function DepthPhotographs({ images, title }: { images: EditorialImage[]; title: string }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const section = root.current
    if (!section) return
    const media = matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    let visible = true
    const update = () => {
      frame = 0
      if (!visible) return
      const stage = section.querySelector<HTMLElement>(".depth-stage")!
      const pinned = getComputedStyle(stage).position === "sticky"
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight)
      const progress = Math.max(0,Math.min(1,(145-rect.top)/travel))
      section.style.setProperty("--composition-progress", String(media.matches || !pinned ? 1 : progress))

    }
    const schedule = () => { if (!frame) frame=requestAnimationFrame(update) }
    const observer = new IntersectionObserver(entries => { visible=entries[0].isIntersecting; if(visible)schedule() },{rootMargin:"100px"})
    observer.observe(section)
    const resize = new ResizeObserver(schedule); resize.observe(section)
    window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",schedule);media.addEventListener("change",schedule);update()
    return()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);media.removeEventListener("change",schedule)}
  },[images])
  return <section ref={root} className="depth-sequence" aria-label={`${title} production photographs`} style={{"--print-count":images.length} as React.CSSProperties}>
    <div className="depth-stage">{images.map((image,index)=><figure className={`depth-print print-${index + 1}`} key={`${image.src}-${index}`}>
      <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
      {image.temporary && <figcaption>Temporary placement / film image</figcaption>}
    </figure>)}</div>
  </section>
}
