"use client"

import { useState } from "react"
import type { Video } from "@/lib/db"
import { getVideoThumbnail } from "@/lib/utils"
import { VideoPlayer } from "@/components/video-player"
import { FEATURED_PROJECTS } from "@/lib/projects/featured"

export function FeaturedProjects({ videos }: { videos: Video[] }) {
  const [selected, setSelected] = useState<Video | null>(null)
  return (
    <>
      {FEATURED_PROJECTS.map((project, index) => {
        const video = videos.find(item => item.id === project.id)
        if (!video) return null
        const image = getVideoThumbnail(video)
        return (
          <section className={`featured-project featured-project-${index + 1}${project.photos.length ? " has-photographs" : ""}`} key={project.id} aria-label={video.title}>
            <div className="featured-stage">
              <button className="featured-open" onClick={() => setSelected(video)} aria-label={`Play ${video.title}`}>
                {image && <img src={image} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" />}
                <span className="featured-play" aria-hidden="true">↗</span>
                <h2>{video.title}</h2>
              </button>
            {project.photos.length > 0 && (
              <div className="featured-photographs" role="group" aria-label={`${video.title} behind the scenes`}>
                {project.photos.map(photo => <figure className={`photo-${photo.layout}`} key={photo.src}><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" /></figure>)}
              </div>
            )}
            </div>
          </section>
        )
      })}
      {selected && <VideoPlayer video={selected} title={selected.title} isOpen onClose={() => setSelected(null)} />}
    </>
  )
}
