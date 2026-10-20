"use client"

import { useEffect, type RefObject } from "react"

/** Native scroll remains in charge; only visible compositions are measured. */
export function useScrollComposition(rootRef: RefObject<HTMLElement | null>, selector: string) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const active = new Set<HTMLElement>()
    const tracked = new Set<HTMLElement>()
    let frame = 0
    const update = () => {
      frame = 0
      const readings = [...active].map(element => ({ element, rect: element.getBoundingClientRect() }))
      readings.forEach(({ element, rect }) => {
        const arrival = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight * .65)))
        element.style.setProperty("--arrival", String(reduced.matches ? 1 : arrival))
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? active.add(entry.target as HTMLElement) : active.delete(entry.target as HTMLElement))
      schedule()
    }, { rootMargin: "120px" })
    const discover = () => {
      root.querySelectorAll<HTMLElement>(selector).forEach(element => {
        if (!tracked.has(element)) { tracked.add(element); observer.observe(element) }
      })
      tracked.forEach(element => { if (!root.contains(element)) { observer.unobserve(element); tracked.delete(element); active.delete(element) } })
      schedule()
    }
    const mutations = new MutationObserver(discover)
    mutations.observe(root, { childList: true, subtree: true })
    discover()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    reduced.addEventListener("change", schedule)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      mutations.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      reduced.removeEventListener("change", schedule)
    }
  }, [rootRef, selector])
}
