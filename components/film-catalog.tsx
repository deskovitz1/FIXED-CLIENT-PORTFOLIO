"use client"

import Link from "next/link"
import { FEATURED_PROJECTS } from "@/lib/projects/featured"
import { useState } from "react"
import type { Video } from "@/lib/db"
import { getVideoThumbnail } from "@/lib/utils"
import { WORK_CATEGORIES } from "@/components/site-navigation"

function FilmImage({ video, eager }: { video: Video; eager: boolean }) {
  const thumbnail = getVideoThumbnail(video)
  const [failed, setFailed] = useState(false)
  return thumbnail && !failed ? (
    <img src={thumbnail} alt="" loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />
  ) : <span className="catalog-image-title">{video.title}</span>
}

export function FilmCatalog({ videos, category, onSelect }: {
  videos: Video[]; category: string | null; onSelect: (video: Video) => void
}) {
  const rememberProject = (slug: string) => {
    try { sessionStorage.setItem("circus-project-origin", `/projects/${slug}`) } catch {}
  }
  return (
    <section className="film-catalog" aria-label="Film portfolio">
      <div className="catalog-heading">
        <h1>{category ? WORK_CATEGORIES.find(item => item.value === category)?.label || category : "Work"}</h1>
        <span>{String(videos.length).padStart(2, "0")}</span>
      </div>
      <div className="catalog-grid">
        {videos.map((video, index) => {
          const categoryName = WORK_CATEGORIES.find(item => item.value === video.category)?.label || video.category
          const project = FEATURED_PROJECTS.find(item => item.id === video.id)
          return (
            <article className={`catalog-film ${index === 0 ? "catalog-feature" : ""}`} key={video.id}>
              {project ? (
              <Link className="catalog-image" href={`/projects/${project.slug}`} onClick={() => rememberProject(project.slug)} aria-label={`View ${video.title}`}>
                <FilmImage video={video} eager={index === 0} />
                {index === 0 && <span className="catalog-feature-title" aria-hidden="true">{video.title}</span>}
                <span className="catalog-play" aria-hidden="true">↗</span>
              </Link>
              ) : (
              <button className="catalog-image" onClick={() => onSelect(video)} aria-label={`Play ${video.title}`}>
                <FilmImage video={video} eager={index === 0} />
                {index === 0 && <span className="catalog-feature-title" aria-hidden="true">{video.title}</span>}
                <span className="catalog-play" aria-hidden="true">↗</span>
              </button>
              )}
              <div className="catalog-caption">
                {project ? <Link href={`/projects/${project.slug}`} onClick={() => rememberProject(project.slug)}><h2>{video.title}</h2></Link> : <button onClick={() => onSelect(video)}><h2>{video.title}</h2></button>}
                {categoryName && <span>{categoryName}</span>}
              </div>
              {video.description && <p className="catalog-description">{video.description}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
