"use client";

/**
 * Route: /menu (Main Menu - Circle Video Selector)
 *
 * Video data source:
 * - Reuses the same API as the admin "All Videos" page: GET /api/videos
 * - Uses the Video type from lib/db (id, title, category, blob_url, video_url, etc.)
 *
 * Circle layout:
 * - One large circle centered in the viewport
 * - Circle is divided into equal angular slices (like a pie chart)
 * - Each slice is a wedge created via CSS clip-path using polygon points on a unit circle
 * - Slices are mapped in order onto videos; max number of slices controlled by MAX_SLICES
 *
 * How to adjust:
 * - Change MAX_SLICES below to increase/decrease the number of videos used
 * - The slice geometry is calculated in createSliceClipPath(), which samples points along the outer arc
 */

import { useEffect, useMemo, useState } from "react";
import type { Video } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

// Fixed number of visual slices around the wheel
const SLICE_COUNT = 50;

// TEMP thumbnail assets from "sc tests" folder in blob storage
const TEMP_THUMBNAILS: string[] = [
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.58.35%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.58.44%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.58.55%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.59.04%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.59.10%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.59.10%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-28%20at%2011.59.41%E2%80%AFPM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-29%20at%2012.00.14%E2%80%AFAM.png",
  "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/sc%20tests/Screenshot%202025-11-29%20at%2012.00.30%E2%80%AFAM.png",
];

type SliceInfo = {
  index: number;
  clipPath: string;
  color: string;
  videoIndex: number | null;
};

// Convert polar coordinates (angle in degrees, radius 0..50) to percentage x/y in a 0..100 box.
// Used to build the polygon points for a wedge.
function polarToPercent(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = 50;
  const cy = 50;
  const x = cx + Math.cos(rad) * radius;
  const y = cy + Math.sin(rad) * radius;
  return `${x}% ${y}%`;
}

/**
 * Build a CSS clip-path polygon string that describes a single wedge between startAngle and endAngle.
 * The wedge starts at the circle center and samples multiple points along the outer arc for a smooth edge.
 */
function createSliceClipPath(startAngle: number, endAngle: number, steps: number = 16): string {
  const points: string[] = [];
  // Center of circle
  points.push("50% 50%");

  const angleStep = (endAngle - startAngle) / steps;
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + angleStep * i;
    points.push(polarToPercent(angle, 50));
  }

  return `polygon(${points.join(", ")})`;
}

export default function MainMenuPage() {
  const isMobile = useIsMobile();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [displayVideoIndex, setDisplayVideoIndex] = useState<number | null>(null);
  const [leverPulled, setLeverPulled] = useState(false);
  const router = useRouter();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos");
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error:", res.status, errorText);
        throw new Error(`Failed to fetch videos: ${res.status}`);
      }
      const data = await res.json();
      const allVideos: Video[] = data.videos || [];
      console.log("Circle test videos loaded:", allVideos.length, "videos");
      setVideos(allVideos);
    } catch (err) {
      console.error("Error loading videos for circle test:", err);
      // Set empty array so the page still works
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reuse the admin "All Videos" source: GET /api/videos
    fetchVideos();
    
    // Refresh videos every 30 seconds to pick up new uploads
    const refreshInterval = setInterval(() => {
      fetchVideos();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Log the videos actually being used in the circle so we can inspect the URL field
  useEffect(() => {
    if (videos.length) {
      console.log("Circle test videos (used in circle):", videos);
    }
  }, [videos]);

  // Inject circus lights animations
  useEffect(() => {
    const styleId = "circus-lights-animations";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .circus-light {
        width: 8px;
        height: 8px;
        position: absolute;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: #f97316;
        opacity: 0.2;
        transition: opacity 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 0 3px rgba(249, 115, 22, 0.2);
      }
      
      .circus-light--active {
        opacity: 0.9;
        box-shadow: 0 0 6px rgba(249, 115, 22, 0.6), 0 0 10px rgba(249, 115, 22, 0.4);
        animation: casinoLightPulse 0.8s ease-in-out infinite;
      }
      
      @keyframes casinoLightPulse {
        0%, 100% {
          opacity: 0.7;
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.15);
        }
      }
      
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const slices: SliceInfo[] = useMemo(() => {
    const count = SLICE_COUNT;
    const anglePerSlice = 360 / count;

    // Simple circus-inspired pastel palette for placeholder wedges
    const COLORS = [
      "#F97373", // soft red
      "#FDBA74", // orange
      "#FACC15", // yellow
      "#4ADE80", // green
      "#38BDF8", // blue
      "#A855F7", // purple
      "#F472B6", // pink
      "#FB7185", // coral
    ];

    return Array.from({ length: count }).map((_, index) => {
      const startAngle = -90 + index * anglePerSlice; // Start from top
      const endAngle = startAngle + anglePerSlice;
      const clipPath = createSliceClipPath(startAngle, endAngle);
      const color = COLORS[index % COLORS.length];

      // Optional future behavior: attach a video to this slice
      const videoIndex =
        videos.length > 0 ? index % videos.length : null;

      return { index, clipPath, color, videoIndex };
    });
  }, [videos]);

  const handleSliceClick = (video: Video) => {
    const url = video.video_url || video.blob_url;
    if (!url) return;

    // Match admin behavior: open underlying video URL (blob_url / video_url)
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const activeVideo =
    displayVideoIndex != null && videos[displayVideoIndex]
      ? videos[displayVideoIndex]
      : selectedVideoIndex != null && videos[selectedVideoIndex]
      ? videos[selectedVideoIndex]
      : videos[0];

  const spinWheel = () => {
    if (isSpinning) return;
    // Allow spinning even if no videos (for testing)
    if (videos.length === 0) {
      console.warn("No videos loaded, but allowing spin for testing");
    }

    setIsSpinning(true);
    setSelectedSliceIndex(null);
    setSelectedVideoIndex(null);

    const sliceAngle = 360 / SLICE_COUNT;
    const targetSliceIndex = Math.floor(Math.random() * SLICE_COUNT);
    const centerOffset = sliceAngle / 2;
    const targetAngle = 360 - targetSliceIndex * sliceAngle - centerOffset;
    const extraSpins = 360 * 6; // multiple full turns
    const finalRotation = rotation + extraSpins + targetAngle;

    // Use requestAnimationFrame to ensure transition is applied before rotation change
    requestAnimationFrame(() => {
      setRotation(finalRotation);
    });

    // Determine which video this slice corresponds to
    const videoIndex =
      videos.length > 0 ? targetSliceIndex % videos.length : null;

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedSliceIndex(targetSliceIndex);
      setSelectedVideoIndex(videoIndex);
      setDisplayVideoIndex(videoIndex);
    }, 4600);
  };

  const handleLeverPullStart = () => {
    if (isSpinning) return;
    setLeverPulled(true);
  };

  const handleLeverPullEnd = () => {
    if (isSpinning) return;
    if (!leverPulled) return;
    setLeverPulled(false);
    spinWheel();
  };

  // While spinning, cycle through video titles so the user sees different names flash by
  useEffect(() => {
    if (!isSpinning || videos.length === 0) return;

    let index = 0;
    const interval = setInterval(() => {
      setDisplayVideoIndex((prev) => {
        if (prev == null) return 0;
        const next = (prev + 1) % videos.length;
        index = next;
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isSpinning, videos.length]);

  // When the wheel stops and we have a selected video index, lock the display on that video
  useEffect(() => {
    if (!isSpinning && selectedVideoIndex != null && videos[selectedVideoIndex]) {
      setDisplayVideoIndex(selectedVideoIndex);
    }
  }, [isSpinning, selectedVideoIndex, videos]);

  return (
    <main className="circle-test-page min-h-screen w-full flex flex-col items-center justify-between bg-white text-black px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-10 relative overflow-hidden">
      {/* Casino-style lights around the perimeter */}
      <div className="circus-lights-container absolute inset-0 pointer-events-none z-0">
        {/* Top row */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`top-${i}`}
            className={`circus-light absolute top-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              left: `${(i + 1) * (100 / 21)}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
        
        {/* Bottom row */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`bottom-${i}`}
            className={`circus-light absolute bottom-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              left: `${(i + 1) * (100 / 21)}%`,
              animationDelay: `${(i + 10) * 0.1}s`,
            }}
          />
        ))}
        
        {/* Left side */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`left-${i}`}
            className={`circus-light absolute left-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              top: `${(i + 1) * (100 / 13)}%`,
              animationDelay: `${(i + 5) * 0.1}s`,
            }}
          />
        ))}
        
        {/* Right side */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`right-${i}`}
            className={`circus-light absolute right-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              top: `${(i + 1) * (100 / 13)}%`,
              animationDelay: `${(i + 15) * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Top navigation - centered */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-center mb-4 sm:mb-6 md:mb-8 pt-2 sm:pt-3 md:pt-4">
        <nav className="flex items-center gap-2 sm:gap-3 md:gap-5 lg:gap-8 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em] uppercase flex-wrap justify-center">
          <a
            href="/videos"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">All</span>
            </span>
          </a>
          <a
            href="/videos?category=recent-work"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Recent Work</span>
            </span>
          </a>
          <a
            href="/videos?category=music-video"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Music</span>
            </span>
          </a>
          <a
            href="/videos?category=industry-work"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Launch Videos</span>
            </span>
          </a>
          <a
            href="/videos?category=clothing"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Clothing</span>
            </span>
          </a>
          {/* Link to old menu page */}
          <a
            href="/circle-video-test"
            className="group relative inline-flex items-center"
          >
            <span className="px-1 py-0.5 rounded-[3px] group-hover:bg-red-500/90 transition-colors">
              <span className="relative z-10 text-black group-hover:text-white">Old Menu</span>
            </span>
          </a>
        </nav>
      </header>

      {/* Video count and refresh button */}
      <div className="absolute top-20 right-4 z-20 flex items-center gap-3">
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Refresh Videos"}
        </button>
        <span className="text-xs text-gray-500">
          {videos.length} video{videos.length !== 1 ? "s" : ""} loaded
        </span>
      </div>

      {loading ? (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🎪</div>
            <p className="text-sm text-gray-500 tracking-[0.25em] uppercase">
              Loading circle collage…
            </p>
          </div>
        </div>
      ) : !slices.length ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          <div className="text-center">
            <p className="text-lg text-gray-800 mb-2">No videos available</p>
            <p className="text-xs text-gray-500 uppercase tracking-[0.25em]">
              Upload videos in the admin panel to populate this circle
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 sc-page w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-24 xl:gap-32 flex-1 py-4 sm:py-6 md:py-8 lg:py-12">
          {/* Left side: lever + wheel in a row */}
          <div className="sc-left flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 flex-shrink-0">
            {/* Minimal lever on the left */}
            <div
              className={`lever-mount relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] flex items-center justify-start cursor-pointer min-h-[44px] min-w-[44px] ${
                isSpinning ? "lever-mount--disabled opacity-50 cursor-not-allowed" : ""
              }`}
              onMouseDown={handleLeverPullStart}
              onMouseUp={handleLeverPullEnd}
              onMouseLeave={handleLeverPullEnd}
              onTouchStart={(e) => {
                e.preventDefault();
                handleLeverPullStart();
              }}
              onTouchEnd={handleLeverPullEnd}
            >
              {/* Lever arm: red ball + bar into base (visually pivoting in center of base) */}
              <div
                className="lever-arm absolute left-1 top-1/2 w-[130px] h-9"
                style={{
                  transformOrigin: "90% 50%",
                  // At rest: slightly angled up; when pulled: swings down, pivoting around center of base
                  transform: leverPulled || isSpinning
                    ? "translateY(-50%) rotate(-25deg)"
                    : "translateY(-50%) rotate(20deg)",
                  transition: "transform 0.15s ease-out",
                }}
              >
                <div className="lever-ball absolute left-0 top-1/2 w-[28px] h-[28px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe5e5,#ff3b3b_55%,#8b0000)] shadow-[0_5px_10px_rgba(0,0,0,0.5)]" />
                {/* Bar aligned to emerge from the center slot of the base */}
                <div className="lever-bar absolute left-[26px] right-[30px] top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-neutral-900 shadow-[0_0_3px_rgba(0,0,0,0.6)]" />
              </div>
              {/* Vertical base with slot on the right */}
              <div className="lever-base absolute right-0 top-1/2 w-[32px] h-[80px] -translate-y-1/2 rounded-[7px] bg-neutral-900 shadow-[0_7px_16px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <div className="lever-slot w-[5px] h-[60px] rounded-[3px] bg-neutral-700" />
              </div>
            </div>

            {/* WHEEL COLUMN (right of lever) */}
            <div className="wheel-column flex flex-col items-center justify-center flex-shrink-0">
              <div
                className="circle-wrapper relative rounded-full overflow-hidden border-2 border-gray-300 shadow-[0_20px_60px_rgba(15,23,42,0.25)] bg-white"
                style={{
                  width: isMobile ? "min(85vw, 400px)" : "600px",
                  height: isMobile ? "min(85vw, 400px)" : "600px",
                  maxWidth: isMobile ? "min(85vw, 400px)" : "min(75vmin, 600px)",
                  maxHeight: isMobile ? "min(85vw, 400px)" : "min(75vmin, 600px)",
                  aspectRatio: "1 / 1",
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? "transform 4.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    : "transform 0.3s ease-out",
                  willChange: isSpinning ? "transform" : "auto",
                }}
              >
                {/* Slices */}
                {slices.map(({ videoIndex, index, clipPath, color }) => {
                  const video = videoIndex != null ? videos[videoIndex] : undefined;
                  const isHovered = hoveredIndex === index;
                  const thumb =
                    TEMP_THUMBNAILS.length > 0
                      ? TEMP_THUMBNAILS[index % TEMP_THUMBNAILS.length]
                      : null;

                  return (
                    <button
                      key={`slice-${index}`}
                      type="button"
                      onClick={() => {
                        if (isSpinning || videoIndex == null) return;
                        setSelectedSliceIndex(index);
                        setSelectedVideoIndex(videoIndex);
                        setDisplayVideoIndex(videoIndex);
                      }}
                      onMouseEnter={() => !isSpinning && setHoveredIndex(index)}
                      onMouseLeave={() => !isSpinning && setHoveredIndex(null)}
                      className={[
                        "circle-slice absolute inset-0 group transition-transform duration-200 ease-out",
                        isHovered && !isSpinning ? "scale-[1.02]" : "",
                        isSpinning ? "pointer-events-none" : "cursor-pointer",
                      ].join(" ")}
                      style={{
                        WebkitClipPath: clipPath,
                        clipPath,
                      }}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={video?.title || `Slice ${index + 1}`}
                          className="circle-slice-image w-full h-full object-cover block transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                      )}
                    </button>
                  );
                })}

                {/* Optional inner ring for structure */}
                <div className="pointer-events-none absolute inset-[6%] rounded-full border border-white/80" />
              </div>

              {/* Pointer at the bottom indicating selection */}
              <div className="wheel-pointer pointer-events-none mt-2">
                <div className="wheel-pointer-bottom w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-red-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
              </div>
            </div>
          </div>

          {/* Right column: CRT TV that plays the selected video */}
          <div className="sc-right flex items-center justify-center flex-shrink-0 w-full lg:w-auto">
            <div className="crt-shell flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[90vw] sm:max-w-none">
              <div className="crt-frame rounded-[24px] sm:rounded-[28px] md:rounded-[32px] bg-[radial-gradient(circle_at_top_left,#444,#111)] p-3 sm:p-4 md:p-5 lg:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] w-full">
                <div className={`crt-screen relative ${isMobile ? 'w-full' : 'w-[320px] md:w-[420px] lg:w-[500px]'} aspect-[4/3] bg-black rounded-[16px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden border-[4px] sm:border-[5px] border-[#222] shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] flex-shrink-0 mx-auto`}>
                  {activeVideo ? (
                    <video
                      key={activeVideo.id}
                      src={activeVideo.video_url || activeVideo.blob_url || ""}
                      className="crt-video w-full h-full object-cover"
                      controls
                      autoPlay
                    />
                  ) : (
                    <div className="crt-placeholder w-full h-full flex items-center justify-center text-sm text-gray-400">
                      Spin the wheel to pick a video
                    </div>
                  )}
                  {/* Scanline overlay */}
                  <div className="crt-scanlines pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)] mix-blend-soft-light" />
                </div>
              </div>
              {/* CRT controls */}
              <div className="crt-controls flex items-center justify-center gap-5 w-full mt-1">
                <div className="crt-knob w-[36px] h-[36px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#666,#222)] shadow-[0_4px_12px_rgba(0,0,0,0.7)] border border-gray-700" />
                <div className="crt-knob w-[36px] h-[36px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#666,#222)] shadow-[0_4px_12px_rgba(0,0,0,0.7)] border border-gray-700" />
                <div className="crt-speaker w-[100px] h-[32px] rounded-[16px] bg-[repeating-linear-gradient(to_right,#333_0,#333_2px,#111_2px,#111_4px)] border border-gray-700" />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
