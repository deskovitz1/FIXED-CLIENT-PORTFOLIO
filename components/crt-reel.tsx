"use client"

import { useEffect, useRef, useState } from "react"
import { BroadcastIdent } from "@/components/broadcast-ident"
import styles from "./crt-reel.module.css"

// Drop the exported reel here; no code changes are required.
export const DIRECTOR_REEL_SRC = "/videos/director-reel-tv.mp4"

export function CrtReel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const manuallyPaused = useRef(false)
  const firstFrame = useRef<number | null>(null)

  const revealFrame = () => {
    const video = videoRef.current
    if (!video || ready || firstFrame.current !== null) return
    if (typeof video.requestVideoFrameCallback === "function") {
      firstFrame.current = video.requestVideoFrameCallback(() => {
        firstFrame.current = null
        setReady(true)
      })
    } else if (video.readyState >= 2) {
      setReady(true)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || failed) return
    let visible = true
    let disposed = false
    let shouldPlay: boolean | undefined
    const sync = () => {
      const portfolio = document.getElementById("portfolio")
      const covered = portfolio && portfolio.getBoundingClientRect().top <= video.getBoundingClientRect().top
      const next = !document.hidden && visible && !covered && !manuallyPaused.current
      if (next === shouldPlay) return
      shouldPlay = next
      if (!next) {
        video.pause()
      } else {
        void video.play().catch(() => { if (!disposed) setPaused(true) })
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    observer.observe(video)
    document.addEventListener("visibilitychange", sync)
    window.addEventListener("scroll", sync, { passive: true })
    sync()
    return () => {
      disposed = true
      observer.disconnect()
      document.removeEventListener("visibilitychange", sync)
      window.removeEventListener("scroll", sync)
      if (firstFrame.current !== null) {
        video.cancelVideoFrameCallback(firstFrame.current)
        firstFrame.current = null
      }
      video.pause()
    }
  }, [failed])

  if (failed) return <BroadcastIdent />

  return (
    <div className={styles.screen} data-ready={ready}>
      <video
        ref={videoRef}
        className={styles.footage}
        src={DIRECTOR_REEL_SRC}
        poster="/videos/director-reel-poster.jpg"
        autoPlay muted loop playsInline preload="auto"
        aria-label="Director’s reel playing on the vintage television"
        onPlaying={() => { revealFrame(); setPaused(false) }}
        onLoadedData={revealFrame}
        onPause={() => setPaused(true)}
        onError={() => setFailed(true)}
      />
      <>
        <div className={styles.glass} aria-hidden="true" />
        <div className={styles.noise} aria-hidden="true" />
      </>
      {ready && <button
        type="button"
        className={styles.playback}
        data-paused={paused}
        aria-label={paused ? "Play director’s reel" : "Pause director’s reel"}
        onClick={() => {
          const video = videoRef.current
          if (!video) return
          manuallyPaused.current = !video.paused
          if (video.paused) void video.play().catch(() => setPaused(true))
          else video.pause()
        }}
      >{paused ? "PLAY" : "PAUSE"}</button>}
    </div>
  )
}
