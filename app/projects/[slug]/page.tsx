import { notFound } from "next/navigation"
import { getVideoById } from "@/lib/db"
import { FEATURED_PROJECTS } from "@/lib/projects/featured"
import { ProjectGallery } from "@/components/project-gallery"
import { ProjectBackLink } from "@/components/project-back-link"
import { VimeoPlayer } from "@/components/VimeoPlayer"
import "@/styles/project-detail.css"

export const dynamic = "force-dynamic"

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = FEATURED_PROJECTS.find(item => item.slug === slug)
  if (!project) notFound()
  const video = await getVideoById(project.id)
  if (!video || video.is_visible === false) notFound()
  return (
    <>
      <main className="project-detail">
        <nav className="project-navigation" aria-label="Project navigation"><ProjectBackLink /></nav>
        <div className="project-video" aria-label={`${video.title} film`}>
          {video.vimeo_id ? (
            <VimeoPlayer videoId={video.vimeo_id} hash={video.vimeo_hash} title={false} byline={false} portrait={false} autoplay={false} muted={false} loop={false} aspectRatio="16/9" className="w-full h-full" />
          ) : <video controls playsInline preload="metadata" src={video.video_url || video.blob_url} poster={video.thumbnail_url || undefined} />}
        </div>
        <ProjectGallery photos={project.photos} title={video.title} />
      </main>
    </>
  )
}
