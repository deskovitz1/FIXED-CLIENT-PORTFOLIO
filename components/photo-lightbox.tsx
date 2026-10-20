"use client"

import { useEffect, useRef, useState } from "react"
import { PostcardVideo } from "@/components/postcard-video"
import { createPortal } from "react-dom"
import "@/styles/photo-lightbox.css"

type Photo = { src: string; alt: string; kind?: "image" | "video" }
export function PhotoLightbox({ photos, initialIndex, title, onClose }: { photos: Photo[]; initialIndex: number; title: string; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  const dialog = useRef<HTMLDivElement>(null)
  const wheel = useRef({total:0, last:0})
  const start = useRef<number | null>(null)
  const close = useRef(onClose)
  close.current = onClose
  const move = (direction: number) => setIndex(i => (i + direction + photos.length) % photos.length)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current() }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setIndex(i => (i + (e.key === "ArrowRight" ? 1 : -1) + photos.length) % photos.length) }
      if (e.key === "Tab") {
        const buttons = [...dialog.current!.querySelectorAll<HTMLElement>("button, video[controls]")]
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener("keydown", key)
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", key); previous?.focus({preventScroll:true}) }
  }, [photos.length])
  useEffect(() => { dialog.current?.querySelector<HTMLElement>("[aria-current=true]")?.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"}) }, [index])
  return createPortal(<div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`${title} photo gallery`} tabIndex={-1} ref={dialog}>
    <header><span>{title}</span><span aria-live="polite">{String(index + 1).padStart(2,"0")} / {String(photos.length).padStart(2,"0")}</span><button onClick={onClose} aria-label="Close photo gallery">CLOSE ×</button></header>
    <div className="photo-lightbox-stage" onWheel={e => {
      if (e.ctrlKey) return
      const now = Date.now()
      if (now - wheel.current.last < 450) return
      wheel.current.total += e.deltaY
      if (Math.abs(wheel.current.total) >= 60) {
        move(wheel.current.total > 0 ? 1 : -1)
        wheel.current = {total:0,last:now}
      }
    }} onTouchStart={e => {start.current = e.touches[0].clientX}} onTouchEnd={e => {if (start.current !== null && Math.abs(e.changedTouches[0].clientX - start.current) > 50) move(e.changedTouches[0].clientX < start.current ? 1 : -1); start.current = null}}>
      {photos[index].kind === "video" ? <PostcardVideo key={photos[index].src} src={photos[index].src} label={photos[index].alt} controls /> : <img src={photos[index].src} alt={photos[index].alt} />}
      <button className="photo-previous" onClick={() => move(-1)} aria-label="Previous photo">←</button>
      <button className="photo-next" onClick={() => move(1)} aria-label="Next photo">→</button>
    </div>
    <nav className="photo-lightbox-strip" aria-label="Gallery images">{photos.map((photo,i) => <button key={`${photo.src}-${i}`} aria-label={`View photo ${i + 1}`} aria-current={index === i ? "true" : undefined} onClick={() => setIndex(i)}>{photo.kind === "video" ? <span className="postcard-thumbnail">▶<small>POSTCARD</small></span> : <img src={photo.src} alt="" loading="lazy" />}</button>)}</nav>
  </div>, document.body)
}
