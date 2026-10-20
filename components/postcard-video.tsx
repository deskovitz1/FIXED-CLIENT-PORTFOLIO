"use client"
import { useEffect, useRef } from "react"

export function PostcardVideo({ src, label, controls = false }: { src: string; label: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = ref.current!
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false
    const sync = () => {
      if (visible && !document.hidden && !reduced.matches) video.play().catch(() => {})
      else video.pause()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, {threshold:.15})
    observer.observe(video)
    document.addEventListener("visibilitychange",sync)
    reduced.addEventListener("change",sync)
    return () => { observer.disconnect(); video.pause(); document.removeEventListener("visibilitychange",sync); reduced.removeEventListener("change",sync) }
  }, [src])
  return <video ref={ref} src={src} aria-label={label} muted loop playsInline controls={controls} preload="metadata" className="postcard-video" />
}
