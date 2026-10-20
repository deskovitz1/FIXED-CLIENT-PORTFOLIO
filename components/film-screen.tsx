"use client"
import { useState } from "react"
import type { Video } from "@/lib/db"
import { getVideoThumbnail } from "@/lib/utils"
import { VimeoPlayer } from "@/components/VimeoPlayer"

export function FilmScreen({ video, eager }: { video: Video; eager: boolean }) {
  const [playing, setPlaying] = useState(false)
  const words = video.title.split(" ")
  let lines = [video.title]
  if (video.title.length > 26 && words.length > 1) {
    let split = 1
    for (let i = 1; i < words.length; i++) {
      if (Math.abs(words.slice(0,i).join(" ").length - words.slice(i).join(" ").length) < Math.abs(words.slice(0,split).join(" ").length - words.slice(split).join(" ").length)) split = i
    }
    lines = [words.slice(0,split).join(" "), words.slice(split).join(" ")]
  }
  return <div className={`film-screen${playing ? " film-screen-playing" : ""}`}>
    {playing ? video.vimeo_id ? <VimeoPlayer videoId={video.vimeo_id} hash={video.vimeo_hash} autoplay muted={false} loop={false} title={false} byline={false} portrait={false} className="film-screen-player" /> : <video src={video.video_url || video.blob_url} controls autoPlay playsInline /> :
      <button className="film-screen-poster" onClick={() => setPlaying(true)} aria-label={`Play ${video.title}`}>
        {getVideoThumbnail(video) && <img src={getVideoThumbnail(video)!} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />}
        <span className="film-screen-title">{lines.map(line => <span key={line}>{line}</span>)}</span>
        <span className="film-screen-play" aria-hidden="true">WATCH FILM <span>↗</span></span>
      </button>}
  </div>
}
