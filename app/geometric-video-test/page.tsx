"use client";

/**
 * Route: /geometric-video-test
 *
 * Video data source:
 * - Fetches from the same API as the admin "All Videos" view: GET /api/videos
 * - Uses the Video type from lib/db (id, title, category, blob_url, video_url, etc.)
 *
 * Geometric layout:
 * - We define a reusable pattern of geometric tile configs (clip-path + grid spans)
 * - Videos are mapped in order onto this pattern (pattern loops if there are more videos)
 * - To change the number/layout of slices, edit the TILE_SHAPES array below.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Video } from "@/lib/db";
import { useIsMobile } from "@/hooks/use-mobile";

type TileShape = {
  clipPath: string;
  colSpan?: string;
  rowSpan?: string;
};

// Base tile pattern for desktop; this will loop if there are more videos than shapes.
// To change the mosaic, edit this array: add/remove entries or tweak the clipPath/grid spans.
const TILE_SHAPES: TileShape[] = [
  {
    // Large diagonal slice
    clipPath: "polygon(0 0, 100% 0, 100% 75%, 25% 100%, 0 75%)",
    colSpan: "lg:col-span-2",
    rowSpan: "lg:row-span-2",
  },
  {
    // Tall triangle
    clipPath: "polygon(0 0, 100% 0, 0 100%)",
    rowSpan: "lg:row-span-2",
  },
  {
    // Diamond-ish
    clipPath: "polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)",
  },
  {
    // Angled strip
    clipPath: "polygon(0 20%, 100% 0, 100% 80%, 0 100%)",
    colSpan: "lg:col-span-2",
  },
  {
    // Right triangle
    clipPath: "polygon(0 0, 100% 0, 100% 100%)",
  },
  {
    // Shallow trapezoid
    clipPath: "polygon(0 15%, 100% 0, 100% 85%, 0 100%)",
  },
  {
    // Inverted triangle
    clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
  },
  {
    // Vertical shard
    clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
    rowSpan: "lg:row-span-2",
  },
];

export default function GeometricVideoTestPage() {
  const isMobile = useIsMobile();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Reuse the same data source as admin "All Videos": GET /api/videos
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/videos");
        if (!res.ok) {
          throw new Error("Failed to fetch videos");
        }
        const data = await res.json();
        const allVideos: Video[] = data.videos || [];
        // Limit to first 20 videos to keep the mosaic performant
        setVideos(allVideos.slice(0, 20));
      } catch (err) {
        console.error("Error loading videos for geometric test:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleTileClick = (video: Video) => {
    const url = video.video_url || video.blob_url;
    if (!url) return;

    // Reuse behavior from admin "Watch Video" button:
    // open the underlying video URL (blob_url / video_url) in a new tab.
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleBackToMenu = () => {
    router.push("/menu");
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#0B0B1A] via-[#1A1024] to-[#3A0712] text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-white/10">
        <button
          type="button"
          onClick={handleBackToMenu}
          className="text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/70 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ← Menu
        </button>
        <div className="text-center flex-1">
          <p className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/40 mb-1">
            Geometric Video Test
          </p>
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold tracking-[0.2em] sm:tracking-[0.3em] text-white/80">
            CIRCUS · GRID
          </h1>
        </div>
        <div className="w-12 sm:w-16 md:w-20 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </header>

      {/* Mosaic area */}
      <section className="relative flex-1 overflow-hidden px-2 sm:px-3 md:px-4 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Subtle background stripes */}
        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light">
          <div className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_60%),repeating-linear-gradient(135deg,_rgba(255,255,255,0.05)_0,_rgba(255,255,255,0.05)_2px,_transparent_2px,_transparent_8px)]" />
        </div>

        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">🎪</div>
              <p className="text-sm text-white/60 tracking-[0.25em] uppercase">
                Loading geometric grid…
              </p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-white/80 mb-2">No videos available</p>
              <p className="text-xs text-white/50 uppercase tracking-[0.25em]">
                Upload videos in the admin panel to populate this grid
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative h-full w-full grid gap-2 sm:gap-3 md:gap-4 lg:gap-5"
            style={{
              gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
            }}
          >
            {videos.map((video, index) => {
              const shape = TILE_SHAPES[index % TILE_SHAPES.length];
              const colSpanClass = shape.colSpan ?? "";
              const rowSpanClass = shape.rowSpan ?? "";

              const hasUrl = !!(video.video_url || video.blob_url);

              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => handleTileClick(video)}
                  disabled={!hasUrl}
                  className={[
                    "group relative overflow-hidden rounded-[12px] sm:rounded-[16px] md:rounded-[18px] border border-white/8 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_16px_40px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.9)] cursor-pointer disabled:cursor-default disabled:opacity-50 min-h-[120px] sm:min-h-[150px]",
                    isMobile ? "col-span-1 row-span-1" : "col-span-2 row-span-1 sm:col-span-2 md:col-span-1", // Mobile: single column, Desktop: responsive
                    !isMobile && colSpanClass,
                    !isMobile && rowSpanClass,
                  ].join(" ")}
                  style={{
                    WebkitClipPath: shape.clipPath,
                    clipPath: shape.clipPath,
                  }}
                >
                  {/* Thumbnail background */}
                  <div className="absolute inset-0">
                    {video.thumbnail_url ? (
                      <div
                        className="w-full h-full bg-center bg-cover scale-110 group-hover:scale-[1.15] transition-transform duration-700 ease-out"
                        style={{
                          backgroundImage: `url(${video.thumbnail_url})`,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-900 via-slate-900 to-indigo-900" />
                    )}
                  </div>

                  {/* Color wash overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-transparent to-indigo-900/40 mix-blend-soft-light" />

                  {/* Hover veil + title */}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/50 transition-colors duration-300" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-white/60">
                      {video.category || "Untitled"}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-white line-clamp-2 md:line-clamp-3">
                      {video.title}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-black/40 text-[10px]">
                        ▶
                      </span>
                      <span>{hasUrl ? "Play" : "No URL"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}


