"use client"

import { useEffect, useRef, useState } from "react"
import "@/styles/film-timeline.css"

type Chapter = { id: string; title: string; top: number }
const clamp = (n: number) => Math.max(0, Math.min(1, n))

export function FilmTimeline() {
  const rail = useRef<HTMLDivElement>(null)
  const slider = useRef<HTMLDivElement>(null)
  const positions = useRef<Chapter[]>([])
  const maximum = useRef(1)
  const dragging = useRef(false)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const main = document.querySelector(".continuous-experience main")
    if (!main) return
    let frame = 0
    let needsMeasure = true
    // Layout offsets remain stable while the film surfaces transform and pin.
    const layoutTop = (node: HTMLElement) => {
      let top = 0
      for (let e: HTMLElement | null = node; e; e = e.offsetParent as HTMLElement | null) top += e.offsetTop
      return top
    }
    const update = () => {
      frame = 0
      if (needsMeasure) {
        needsMeasure = false
        maximum.current = Math.max(1, document.documentElement.scrollHeight - innerHeight)
        const header = document.querySelector(".studio-navigation")?.getBoundingClientRect().height || 145
        positions.current = [...main.querySelectorAll<HTMLElement>("[data-film-anchor]")].map(e => ({
          id: e.dataset.filmAnchor!, title: e.dataset.filmTitle!, top: Math.max(0, layoutTop(e) - header),
        }))
        setChapters(positions.current)
      }
      const progress = clamp(scrollY / maximum.current)
      rail.current?.style.setProperty("--timeline-progress", String(progress))
      document.querySelector<HTMLElement>(".scene-scroll")?.style.setProperty("--invitation-opacity", String(1 - clamp(scrollY / 160)))
      slider.current?.setAttribute("aria-valuenow", String(Math.round(progress * 100)))
      const index = positions.current.findLastIndex(c => scrollY + 8 >= c.top)
      slider.current?.setAttribute("aria-valuetext", `${Math.round(progress * 100)} percent — ${index < 0 ? "Spinner" : positions.current[index].title}`)
      setActive(index)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const measure = () => { needsMeasure = true; schedule() }
    const resize = new ResizeObserver(measure)
    resize.observe(main)
    const mutation = new MutationObserver(measure)
    mutation.observe(main, {childList:true, subtree:true})
    addEventListener("scroll", schedule, {passive:true})
    addEventListener("resize", measure)
    update()
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); removeEventListener("scroll", schedule); removeEventListener("resize", measure) }
  }, [])

  const go = (top: number, direct = false) => scrollTo({top, behavior: direct || matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"})
  const seek = (y: number) => {
    const rect = rail.current!.getBoundingClientRect()
    go(clamp((y - rect.top) / rect.height) * maximum.current, true)
  }
  return <aside className="film-timeline" aria-label="Film journey">
    <div className="film-timeline-rail" ref={rail}>
      <div ref={slider} className="film-timeline-seek" role="slider" tabIndex={0} aria-label="Scroll through films" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}
        onPointerDown={e => { if (e.button !== 0) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientY) }}
        onPointerMove={e => { if (dragging.current) seek(e.clientY) }}
        onPointerUp={e => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId) }}
        onPointerCancel={() => { dragging.current = false }}
        onLostPointerCapture={() => { dragging.current = false }}
        onKeyDown={e => {
          const steps: Record<string, number> = {ArrowDown:innerHeight * .15, ArrowRight:innerHeight * .15, ArrowUp:-innerHeight * .15, ArrowLeft:-innerHeight * .15, PageDown:innerHeight * .8, PageUp:-innerHeight * .8}
          if (e.key === "Home" || e.key === "End" || e.key in steps) { e.preventDefault(); go(e.key === "Home" ? 0 : e.key === "End" ? maximum.current : scrollY + steps[e.key], true) }
        }}>
        <span className="film-timeline-marker" />
      </div>
      {chapters.map((chapter, i) => <button key={chapter.id} className="film-timeline-chapter" style={{top:`${clamp(chapter.top / maximum.current) * 100}%`}} aria-label={`${String(i + 1).padStart(2,"0")} — ${chapter.title}`} aria-current={active === i ? "step" : undefined} onClick={() => go(chapter.top)}>
        <span className="film-timeline-label">{String(i + 1).padStart(2,"0")} — {chapter.title}</span>
      </button>)}
    </div>
  </aside>
}
