"use client"

import { useEffect, useRef } from "react"

export function FilmGrain() {
  const grainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animationFrame: number
    let offset = 0

    const animate = () => {
      if (grainRef.current) {
        offset += 0.5
        grainRef.current.style.transform = `translate(${Math.sin(offset * 0.01) * 2}px, ${Math.cos(offset * 0.01) * 2}px)`
      }
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <>
      {/* SVG filter definition for film grain effect */}
      <svg className="absolute w-0 h-0">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 0 0 1" />
          </feComponentTransfer>
        </filter>
      </svg>

      <div
        ref={grainRef}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          filter: "url(#grain)",
          opacity: 0.8, // Increased from 0.15 to 0.8 for much more prominent grain
          mixBlendMode: "overlay",
        }}
        aria-hidden="true"
      />
    </>
  )
}
