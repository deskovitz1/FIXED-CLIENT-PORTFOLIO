"use client"
import { useEffect, useRef, useState } from "react"

export function PostcardVideo({ src, mobileSrc, poster, label, controls = false }: { src: string; mobileSrc?: string; poster?: string; label: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [source, setSource] = useState<string>()
  useEffect(() => {
    const video = ref.current!
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false
    const prepare = () => setSource(matchMedia("(max-width: 767px)").matches && mobileSrc ? mobileSrc : src)
    const sync = () => {
      if (visible && !document.hidden && !reduced.matches) video.play().catch(() => {})
      else video.pause()
    }
    // Distant projects make no video requests. Warm only the next nearby grid.
    const warm = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { prepare(); warm.disconnect() }
    }, {rootMargin:"200px 0px"})
    warm.observe(video)
    if (controls) prepare()
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, {threshold:.15})
    observer.observe(video)
    video.addEventListener("canplay", sync)
    document.addEventListener("visibilitychange",sync)
    reduced.addEventListener("change",sync)
    return () => { warm.disconnect(); observer.disconnect(); video.pause(); video.removeEventListener("canplay",sync); document.removeEventListener("visibilitychange",sync); reduced.removeEventListener("change",sync) }
  }, [src, mobileSrc, controls])
  return <video ref={ref} src={source} poster={poster} aria-label={label} muted loop playsInline controls={controls} preload={source ? "auto" : "none"} className="postcard-video" />
}
