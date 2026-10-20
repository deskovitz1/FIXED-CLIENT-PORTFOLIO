"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SpinnerExperience } from "@/components/spinner-experience"
import { VideoHomepage } from "@/components/video-homepage"
import type { Video } from "@/lib/db"
import { pageAdvance } from "@/lib/projects/transition"
import { FilmTimeline } from "@/components/film-timeline"
import { SiteNavigation } from "@/components/site-navigation"
import "@/app/menu/carnival.css"
import "@/app/menu/studio-machine.css"
import "@/styles/continuous-experience.css"

export function ContinuousExperience({ initialSection = "spinner" }: { initialSection?: "spinner" | "work" }) {
  const [phone, setPhone] = useState<boolean | null>(null)
  useEffect(() => {
    const query = matchMedia("(max-width: 767px)")
    const update = () => setPhone(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  const [videos, setVideos] = useState<Video[]>([])
  const searchParams = useSearchParams()
  const category = searchParams.get("category") || ""
  const router = useRouter()
  const pathname = usePathname()
  const rootRef = useRef<HTMLDivElement>(null)
  const workRef = useRef<HTMLElement>(null)
  const portfolioRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const root = rootRef.current
    const work = workRef.current
    if (!root || !work) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const update = () => {
      frame = 0
      // Measure the untransformed section; animate its complete content surface.
      const top = work.getBoundingClientRect().top
      const { progress, eased } = pageAdvance(top, innerHeight)
      root.style.setProperty("--advance", String(reduced.matches ? 1 : eased))
      root.style.setProperty("--curtain", String(reduced.matches ? 0 : progress))

    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(root)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    reduced.addEventListener("change", schedule)
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      reduced.removeEventListener("change", schedule)
    }
  }, [])

  useEffect(() => {
    if (initialized.current || phone === null) return
    const target = window.location.hash.slice(1) || (category ? "portfolio" : initialSection)
    if ((target === "work" || target === "portfolio") && !phone && videos.length === 0) return
    initialized.current = true
    if (target === "work" || target === "portfolio") {
      document.getElementById(target)?.scrollIntoView({ behavior: "instant", block: "start" })
    }
  }, [initialSection, category, videos.length, phone])

  const filterCategory = (value: string) => {
    const query = new URLSearchParams(searchParams.toString())
    if (value) query.set("category", value)
    else query.delete("category")
    router.replace(`${pathname}${query.size ? `?${query}` : ""}#portfolio`, { scroll: false })
    portfolioRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }

  return (
    <div className="continuous-experience" ref={rootRef}>
      <SiteNavigation category={category} onCategoryChange={filterCategory} continuous hideSpinner={phone === true} />
      <main>
        {phone !== true && <div id="spinner" className="spinner-scene">
          <div className="spinner-stage">
            <SpinnerExperience onVideosLoaded={setVideos} />
            <div className="scene-focus" aria-hidden="true" />
            <a href="#work" className="scene-scroll" aria-label="Scroll to explore the films">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
          </div>
        </div>}
        <section id="work" ref={workRef} aria-label="Work portfolio" className="portfolio-scene">
          <div id="portfolio" ref={portfolioRef} className="portfolio-surface">
            <VideoHomepage initialCategory={category || undefined} embedded />
          </div>
        </section>
      </main>
      {phone === false && <FilmTimeline />}
    </div>
  )
}
