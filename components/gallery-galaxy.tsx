"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { FEATURED_PROJECTS } from "@/lib/projects/featured"
import "@/styles/gallery-galaxy.css"

const fallback = [...new Set(FEATURED_PROJECTS.flatMap(project => project.photos.map(photo => photo.src)))]

export function GalleryGalaxy() {
  const [images, setImages] = useState(fallback)
  const [cycle, setCycle] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/project-stills", {signal:controller.signal}).then(r => r.ok ? r.json() : {}).then((projects: Record<string, {preview?: {src:string}[]; gallery?: {src:string}[]}>) => {
      const photos = Object.values(projects).flatMap(project => [...(project.gallery || []), ...(project.preview || [])].map(photo => photo.src))
      setImages([...new Set([...photos, ...fallback])])
    }).catch(() => {})
    return () => controller.abort()
  }, [])
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    let active = false
    const update = () => {
      active = !reduced.matches && !document.hidden && scrollY < (root.current?.parentElement?.offsetHeight || innerHeight)
      root.current?.setAttribute("data-moving", String(active))
    }
    const timer = setInterval(() => { if (active) setCycle(value => value + 1) }, 16000)
    addEventListener("scroll", update, {passive:true})
    document.addEventListener("visibilitychange", update)
    reduced.addEventListener("change", update)
    update()
    return () => { clearInterval(timer); removeEventListener("scroll",update); document.removeEventListener("visibilitychange",update); reduced.removeEventListener("change",update) }
  }, [])
  return <div className="gallery-galaxy" ref={root} aria-hidden="true">
    <div className="galaxy-orbit">
      {Array.from({length:Math.min(10,images.length)},(_,i) => <div className={`galaxy-cloud galaxy-cloud-${i}`} key={i}>
        <Image key={`${cycle}-${images[(cycle * 10 + i) % images.length]}`} src={images[(cycle * 10 + i) % images.length]} alt="" fill sizes="420px" quality={35} loading="eager" />
      </div>)}
    </div>
    <div className="galaxy-haze" />
  </div>
}
