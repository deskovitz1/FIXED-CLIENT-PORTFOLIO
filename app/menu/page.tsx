"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

interface Letter {
  char: string
  x: number
  y: number
  vx: number
  vy: number
  isActive: boolean
}

function CircusLetters() {
  const letters = "CIRCUS".split("")
  const [letterStates, setLetterStates] = useState<Letter[]>(() =>
    letters.map((char) => ({
      char,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isActive: false,
    }))
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!letterStates.some((l) => l.isActive)) return

    const animate = () => {
      setLetterStates((prev) => {
        const newStates = prev.map((letter) => {
          if (!letter.isActive) return letter

          const gravity = 0.6
          const friction = 0.98
          const bounce = 0.75

          // Apply gravity
          let newVy = letter.vy + gravity
          let newVx = letter.vx * friction

          // Update position
          let newX = letter.x + newVx
          let newY = letter.y + newVy

          // Get viewport bounds (full screen)
          const letterWidth = 100
          const letterHeight = 120
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          // Bounce off walls
          if (newX <= letterWidth / 2) {
            newVx = -newVx * bounce
            newX = letterWidth / 2
          } else if (newX >= viewportWidth - letterWidth / 2) {
            newVx = -newVx * bounce
            newX = viewportWidth - letterWidth / 2
          }

          if (newY <= letterHeight / 2) {
            newVy = -newVy * bounce
            newY = letterHeight / 2
          } else if (newY >= viewportHeight - letterHeight / 2) {
            newVy = -newVy * bounce
            newY = viewportHeight - letterHeight / 2
            // Add friction when on ground
            newVx *= 0.95
          }

          // Stop if velocity is very small and on ground
          if (
            Math.abs(newVx) < 0.2 &&
            Math.abs(newVy) < 0.2 &&
            newY >= viewportHeight - letterHeight / 2 - 10
          ) {
            return { ...letter, isActive: false, x: newX, y: newY, vx: 0, vy: 0 }
          }

          return {
            ...letter,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          }
        })

        // Continue animation if any letters are still active
        if (newStates.some((l) => l.isActive)) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }

        return newStates
      })
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [letterStates])

  const handleLetterClick = (index: number, e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clickX = e.clientX
    const clickY = e.clientY

    setLetterStates((prev) => {
      const newStates = [...prev]
      const letter = newStates[index]

      // Get current letter position (centered in container)
      const centerX = window.innerWidth / 2
      const centerY = rect.top + rect.height / 2
      const letterX = centerX + (index - 2.5) * 90

      // Calculate velocity based on click direction
      const dx = clickX - letterX
      const dy = clickY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const force = Math.min(distance * 0.15, 20) // Cap the force

      newStates[index] = {
        ...letter,
        x: letterX,
        y: centerY,
        vx: (dx / distance) * force + (Math.random() - 0.5) * 3,
        vy: (dy / distance) * force + (Math.random() - 0.5) * 3 - 8, // Add upward boost
        isActive: true,
      }

      return newStates
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-32 md:h-40 flex items-center justify-center"
      style={{ minHeight: "200px" }}
    >
      {letterStates.map((letter, index) => {
        const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 0
        const baseX = centerX + (index - 2.5) * 90

        return (
          <button
            key={index}
            type="button"
            onClick={(e) => handleLetterClick(index, e)}
            className="absolute cursor-pointer select-none transition-transform hover:scale-110 active:scale-95"
            style={{
              left: letter.isActive ? `${letter.x}px` : "50%",
              top: letter.isActive ? `${letter.y}px` : "50%",
              transform: letter.isActive
                ? "translate(-50%, -50%)"
                : `translate(calc(-50% + ${(index - 2.5) * 90}px), -50%)`,
              transition: letter.isActive ? "none" : "transform 0.3s ease-out",
              zIndex: letter.isActive ? 50 : 10,
            }}
          >
            <span
              className="text-6xl md:text-8xl font-black text-red-600 block"
              style={{ fontFamily: "Helvetica, Arial, sans-serif", letterSpacing: "-0.05em" }}
            >
              {letter.char}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MenuButton({ 
  label, 
  category 
}: { 
  label: string
  category?: string 
}) {
  const router = useRouter()

  const handleClick = () => {
    if (category) {
      router.push(`/videos?category=${encodeURIComponent(category)}`)
    } else {
      router.push("/videos")
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group relative px-8 py-3 text-left w-full max-w-xs transition-all duration-300 hover:translate-x-2"
    >
      {/* Decorative line on left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-px bg-red-600 group-hover:w-8 transition-all duration-300" />
      
      {/* Button text */}
      <span 
        className="text-2xl font-bold text-red-600 tracking-tight group-hover:tracking-wider transition-all duration-300"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
      >
        {label}
      </span>
      
      {/* Subtle underline on hover */}
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
    </button>
  )
}

export default function MainMenuPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [follower1, setFollower1] = useState({ x: 0, y: 0 })
  const [follower2, setFollower2] = useState({ x: 0, y: 0 })
  const [follower3, setFollower3] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
    life: number
    maxLife: number
    rotation: number
    rotationSpeed: number
    hue: number
    targetX: number
    targetY: number
  }>>([])
  const lastMousePosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 })
  
  // Click effects
  const ripplesRef = useRef<Array<{
    x: number
    y: number
    radius: number
    life: number
    maxLife: number
    intensity: number
  }>>([])
  const gridPatternsRef = useRef<Array<{
    x: number
    y: number
    radius: number
    life: number
    maxLife: number
    segments: number
    rotation: number
  }>>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      const now = Date.now()
      const lastPos = lastMousePosRef.current
      
      // Calculate velocity based on mouse movement
      const dx = e.clientX - lastPos.x
      const dy = e.clientY - lastPos.y
      const dt = Math.max(1, now - lastPos.time)
      const speed = Math.sqrt(dx * dx + dy * dy) / dt
      
      // Spawn particles based on movement speed
      const particleCount = Math.min(Math.floor(speed * 0.5), 5)
      
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5
        const velocity = speed * 0.1 + Math.random() * 2
        
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 10,
          y: e.clientY + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * velocity + (Math.random() - 0.5) * 1,
          vy: Math.sin(angle) * velocity + (Math.random() - 0.5) * 1,
          size: 3 + Math.random() * 4,
          life: 1.0,
          maxLife: 1.0,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          hue: 0 + Math.random() * 30, // Red to orange range
          targetX: e.clientX,
          targetY: e.clientY,
        })
      }
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Handle background clicks - expanding rings + unique grid pattern
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }

    const x = e.clientX
    const y = e.clientY

    // Create elegant expanding rings (like water drop)
    for (let i = 0; i < 3; i++) {
      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        life: 1.0,
        maxLife: 1.0,
        intensity: 0.7 - i * 0.15,
      })
    }

    // Create unique expanding radial grid pattern
    const segments = 24 // Number of radial segments
    const rotation = Math.random() * Math.PI * 2 // Random rotation for variety
    
    gridPatternsRef.current.push({
      x,
      y,
      radius: 0,
      life: 1.0,
      maxLife: 1.0,
      segments,
      rotation,
    })
  }

  // Creative particle system trail effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    let animationFrameId: number
    let isFirstDraw = true
    const GRAVITY = 0.05
    const FRICTION = 0.98
    const CONNECTION_DISTANCE = 120
    const MAX_PARTICLES = 300

    const draw = () => {
      // Initialize canvas background on first draw
      if (isFirstDraw) {
        ctx.fillStyle = "#F8F2ED"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        isFirstDraw = false
      }
      
      // Very slow fade (memory foam effect)
      ctx.fillStyle = "rgba(248, 242, 237, 0.02)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        
        // Update physics
        p.vy += GRAVITY
        p.vx *= FRICTION
        p.vy *= FRICTION
        
        // Magnetic attraction to cursor (weak)
        const dx = mousePosition.x - p.x
        const dy = mousePosition.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0 && dist < 200) {
          const force = 0.01 / (dist * 0.01 + 1)
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }
        
        // Update position
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        
        // Update life
        p.life -= 0.005
        
        // Remove dead particles
        if (p.life <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
          particles.splice(i, 1)
          continue
        }
        
        // Limit particle count
        if (particles.length > MAX_PARTICLES) {
          particles.shift()
        }
      }

      // Draw connections between nearby particles
      ctx.lineWidth = 1
      ctx.strokeStyle = "rgba(220, 38, 38, 0.1)"
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * p1.life * p2.life * 0.3
            const hue = (p1.hue + p2.hue) / 2
            
            // Create gradient for connection
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
            gradient.addColorStop(0, `hsla(${p1.hue}, 70%, 50%, ${opacity})`)
            gradient.addColorStop(1, `hsla(${p2.hue}, 70%, 50%, ${opacity})`)
            
            ctx.strokeStyle = gradient
            ctx.lineWidth = 0.5 + opacity * 2
            
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      // Draw particles with glow effect
      for (const p of particles) {
        const alpha = p.life
        const size = p.size * alpha
        
        // Outer glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3)
        gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${alpha * 0.8})`)
        gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 50%, ${alpha * 0.4})`)
        gradient.addColorStop(1, `hsla(${p.hue}, 70%, 50%, 0)`)
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2)
        ctx.fill()
        
        // Main particle with rotation
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        
        // Draw geometric shape (rotating diamond/star)
        const shapeSize = size
        ctx.fillStyle = `hsla(${p.hue}, 80%, 55%, ${alpha * 0.9})`
        ctx.beginPath()
        
        // Create a star/diamond shape
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const radius = i % 2 === 0 ? shapeSize : shapeSize * 0.5
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()
        
        // Inner core
        ctx.fillStyle = `hsla(${p.hue + 20}, 90%, 70%, ${alpha})`
        ctx.beginPath()
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      }

      // Update and draw elegant ripples
      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += 6
        r.life -= 0.015
        
        if (r.life <= 0) {
          ripples.splice(i, 1)
          continue
        }
        
        const alpha = r.life * r.intensity
        // Clean, minimal ripple - single elegant ring
        ctx.strokeStyle = `rgba(220, 38, 38, ${alpha * 0.3})`
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Update and draw unique expanding radial grid pattern
      const gridPatterns = gridPatternsRef.current
      for (let i = gridPatterns.length - 1; i >= 0; i--) {
        const gp = gridPatterns[i]
        gp.radius += 12 // Expand faster
        gp.life -= 0.008 // Fade slower
        
        if (gp.life <= 0 || gp.radius > Math.max(canvas.width, canvas.height) * 1.5) {
          gridPatterns.splice(i, 1)
          continue
        }
        
        const alpha = gp.life * 0.6
        const maxRadius = gp.radius
        const ringCount = Math.floor(maxRadius / 60) // Create rings every 60px
        const segmentAngle = (Math.PI * 2) / gp.segments
        
        ctx.save()
        ctx.translate(gp.x, gp.y)
        ctx.rotate(gp.rotation)
        
        // Draw concentric rings with radial segments
        for (let ring = 1; ring <= ringCount; ring++) {
          const ringRadius = ring * 60
          const ringAlpha = alpha * (1 - ring / ringCount) * 0.4
          
          // Draw radial lines from center
          ctx.strokeStyle = `rgba(220, 38, 38, ${ringAlpha * 0.3})`
          ctx.lineWidth = 0.8
          
          for (let seg = 0; seg < gp.segments; seg++) {
            const angle = seg * segmentAngle
            const x1 = Math.cos(angle) * (ringRadius - 60)
            const y1 = Math.sin(angle) * (ringRadius - 60)
            const x2 = Math.cos(angle) * ringRadius
            const y2 = Math.sin(angle) * ringRadius
            
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
          
          // Draw connecting arcs between segments
          if (ring > 1) {
            ctx.strokeStyle = `rgba(220, 38, 38, ${ringAlpha * 0.2})`
            ctx.lineWidth = 0.5
            
            for (let seg = 0; seg < gp.segments; seg++) {
              const angle1 = seg * segmentAngle
              const angle2 = ((seg + 1) % gp.segments) * segmentAngle
              
              // Connect adjacent radial points with arcs
              ctx.beginPath()
              const x1 = Math.cos(angle1) * ringRadius
              const y1 = Math.sin(angle1) * ringRadius
              const x2 = Math.cos(angle2) * ringRadius
              const y2 = Math.sin(angle2) * ringRadius
              
              ctx.moveTo(x1, y1)
              ctx.quadraticCurveTo(0, 0, x2, y2)
              ctx.stroke()
            }
          }
          
          // Draw ring circle
          ctx.strokeStyle = `rgba(220, 38, 38, ${ringAlpha * 0.25})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2)
          ctx.stroke()
        }
        
        // Draw central hub
        ctx.fillStyle = `rgba(220, 38, 38, ${alpha * 0.2})`
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [mousePosition])

  // Multiple trailing followers with different speeds for a cool effect
  useEffect(() => {
    let animationFrameId: number

    const animate = () => {
      // First follower - closest to cursor
      setFollower1((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15,
        }
      })

      // Second follower - middle trail
      setFollower2((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        return {
          x: prev.x + dx * 0.08,
          y: prev.y + dy * 0.08,
        }
      })

      // Third follower - furthest trail
      setFollower3((prev) => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        return {
          x: prev.x + dx * 0.04,
          y: prev.y + dy * 0.04,
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [mousePosition])

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" 
      style={{ backgroundColor: '#F8F2ED' }}
      onClick={handleBackgroundClick}
    >
      {/* Canvas for memory foam trail effect */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundColor: '#F8F2ED' }}
      />
      
      {/* Cool mouse follower with multiple trailing elements */}
      {/* Third follower - furthest, largest, most transparent */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${follower3.x}px`,
          top: `${follower3.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-red-600/5 blur-xl" />
        <div className="absolute inset-0 w-8 h-8 rounded-full bg-red-600/10 blur-md -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
      </div>

      {/* Second follower - middle trail */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${follower2.x}px`,
          top: `${follower2.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-12 h-12 rounded-full bg-red-600/15 blur-lg" />
        <div className="absolute inset-0 w-6 h-6 rounded-full bg-red-600/25 blur-sm -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
      </div>

      {/* First follower - closest to cursor, most visible */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${follower1.x}px`,
          top: `${follower1.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-8 h-8 rounded-full bg-red-600/20 blur-md" />
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-600/40 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-600/60 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
      </div>

      {/* Decorative geometric elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border-2 border-red-100 rotate-45 opacity-20" />
      <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-red-100 rounded-full opacity-20" />
      <div className="absolute top-1/2 right-20 w-px h-32 bg-red-100 opacity-30" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-16 w-full max-w-4xl">
        {/* Title area */}
        <div className="text-center">
          <CircusLetters />
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="w-12 h-px bg-red-600" />
            <span className="text-red-400 text-sm tracking-widest uppercase">17</span>
            <div className="w-12 h-px bg-red-600" />
          </div>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col items-center gap-2 w-full">
          <MenuButton label="Recent Work" category="recent-work" />
          <MenuButton label="Music" category="music-video" />
          <MenuButton label="Launch Videos" category="industry-work" />
          <MenuButton label="Clothing" category="clothing" />
        </div>
      </div>
    </main>
  )
}
