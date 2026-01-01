"use client";

/**
 * Route: /menu (Main Menu - Circle Video Selector)
 *
 * Video data source:
 * - Uses the same API as the /videos page: GET /api/videos
 * - Uses the Video type from lib/db (id, title, category, blob_url, video_url, thumbnail_url, etc.)
 *
 * Circle layout:
 * - One large circle centered in the viewport
 * - Circle is divided into equal angular slices (like a pie chart)
 * - One slice per video: if there are N videos, there are N slices
 * - Each slice shows that video's thumbnail
 * - Each slice is a wedge created via CSS clip-path using polygon points on a unit circle
 *
 * Selection:
 * - Bottom red triangle indicates the selected slice
 * - selectedVideoIndex maps directly to videos[selectedVideoIndex]
 * - Preview updates during spin to show which video is under the triangle
 */

import { useEffect, useMemo, useState, useRef } from "react";
import type { Video } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { VimeoPlayer } from "@/components/VimeoPlayer";
import { getVideoThumbnail } from "@/lib/utils";

// Pointer position: bottom of the wheel
// The coordinate system: slices start at -90 (top), rotate clockwise
// After CSS rotation, positions are: 0=right, 90=bottom, 180=left, 270=top
// The pointer is visually at the bottom, which is 90 degrees in rotated coordinates
const POINTER_ANGLE = 90;

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
  // Single source of truth: which video in videos array is selected (by index in videos array)
  // Maps directly to videos[selectedVideoIndex]
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  // Preview index during spin (updates as wheel rotates)
  // Maps directly to videos[previewVideoIndex]
  const [previewVideoIndex, setPreviewVideoIndex] = useState<number | null>(null);
  const [leverPulled, setLeverPulled] = useState(false);
  const [isCrtPlaying, setIsCrtPlaying] = useState(false);
  const [hasSpunOnce, setHasSpunOnce] = useState(false); // Track if wheel has been spun
  const wheelRef = useRef<HTMLDivElement>(null);
  const staticVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinSoundRef = useRef<AudioBufferSourceNode | null>(null);
  const lastClickAngleRef = useRef<number | null>(null); // Track last angle where we played a click
  const lastClickTimeRef = useRef<number>(0); // Track last click timestamp to prevent rapid clicks
  const router = useRouter();
  
  // Store winning index and final rotation during spin to use in transitionend handler
  const winningIndexRef = useRef<number | null>(null);
  const finalRotationRef = useRef<number | null>(null);

  // TV Static video URL
  const STATIC_VIDEO_URL = "https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/TV%20Static%20Sound%20Effect%20-%20Bzz%20-%20Alesjo%20Llazari%20%281080p%2C%20h264%29.mp4";

  // Initialize AudioContext on first user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Generate satisfying crank sound (mechanical turning/ratcheting)
  const playLeverSound = () => {
    try {
      const ctx = initAudioContext();
      
      // Create a mechanical crank/ratchet sound - like turning a handle
      
      // First: Initial engagement click
      const clickOsc1 = ctx.createOscillator();
      const clickGain1 = ctx.createGain();
      
      clickOsc1.connect(clickGain1);
      clickGain1.connect(ctx.destination);
      
      clickOsc1.type = 'square';
      clickOsc1.frequency.setValueAtTime(250, ctx.currentTime);
      clickOsc1.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
      
      clickGain1.gain.setValueAtTime(0.12, ctx.currentTime);
      clickGain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      
      clickOsc1.start(ctx.currentTime);
      clickOsc1.stop(ctx.currentTime + 0.06);
      
      // Second: Mechanical ratchet/gear sound
      setTimeout(() => {
        try {
          const ratchetOsc = ctx.createOscillator();
          const ratchetGain = ctx.createGain();
          const ratchetFilter = ctx.createBiquadFilter();
          
          ratchetOsc.connect(ratchetFilter);
          ratchetFilter.connect(ratchetGain);
          ratchetGain.connect(ctx.destination);
          
          // Lower, more mechanical sound
          ratchetOsc.type = 'sawtooth';
          ratchetFilter.type = 'lowpass';
          ratchetFilter.frequency.setValueAtTime(400, ctx.currentTime);
          
          ratchetOsc.frequency.setValueAtTime(120, ctx.currentTime);
          ratchetOsc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
          
          ratchetGain.gain.setValueAtTime(0.08, ctx.currentTime);
          ratchetGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          
          ratchetOsc.start(ctx.currentTime);
          ratchetOsc.stop(ctx.currentTime + 0.15);
        } catch (e) {
          // Ignore
        }
      }, 40);
      
      // Third: Final release click
      setTimeout(() => {
        try {
          const clickOsc2 = ctx.createOscillator();
          const clickGain2 = ctx.createGain();
          
          clickOsc2.connect(clickGain2);
          clickGain2.connect(ctx.destination);
          
          clickOsc2.type = 'square';
          clickOsc2.frequency.setValueAtTime(200, ctx.currentTime);
          clickOsc2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.03);
          
          clickGain2.gain.setValueAtTime(0.1, ctx.currentTime);
          clickGain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          
          clickOsc2.start(ctx.currentTime);
          clickOsc2.stop(ctx.currentTime + 0.05);
        } catch (e) {
          // Ignore
        }
      }, 180);
      
    } catch (err) {
      // Ignore audio errors (autoplay restrictions, etc.)
    }
  };

  // Play a single click sound (called when wheel passes a notch)
  const playClickSound = () => {
    try {
      const ctx = initAudioContext();
      
      // Prevent clicks from overlapping too quickly - minimum 40ms between clicks
      const now = Date.now();
      if (now - lastClickTimeRef.current < 40) {
        return; // Skip this click if too soon
      }
      lastClickTimeRef.current = now;
      
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      
      tickOsc.connect(tickGain);
      tickGain.connect(ctx.destination);
      
      // More playful, lighter click sound - less harsh
      // Slightly vary the frequency for more fun (between 280-320Hz)
      const baseFreq = 300 + (Math.random() - 0.5) * 40;
      tickOsc.type = 'sine'; // Changed from square to sine for softer sound
      tickOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      tickOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, ctx.currentTime + 0.015);
      
      // Much quieter and softer
      tickGain.gain.setValueAtTime(0.035, ctx.currentTime);
      tickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
      
      tickOsc.start(ctx.currentTime);
      tickOsc.stop(ctx.currentTime + 0.025);
    } catch (err) {
      // Ignore audio errors
    }
  };

  // Start tracking wheel rotation for real-time clicks
  const startSpinSoundTracking = () => {
    // Reset tracking
    lastClickAngleRef.current = null;
  };

  // Play final sound when wheel lands and video is selected
  const playFinalSelectionSound = () => {
    try {
      const ctx = initAudioContext();
      
      // Create a calming, gentle bell-like sound
      // Soft and soothing for a peaceful resolution
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Soft, bell-like tone
      osc.type = 'sine';
      
      // Gentle, lower frequency for calmness
      osc.frequency.setValueAtTime(330, ctx.currentTime); // E4 - warm and calming
      
      // Soft lowpass filter for warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      
      // Very gentle fade in and long, smooth fade out
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15); // Slow fade in
      gain.gain.setValueAtTime(0.04, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2); // Long, gentle fade out
      
      // Very gentle pitch drop for extra calmness
      osc.frequency.exponentialRampToValueAtTime(310, ctx.currentTime + 1.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
      
    } catch (err) {
      // Ignore audio errors
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      // Use the same API endpoint as the videos page
      const res = await fetch("/api/videos", { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch videos: ${res.status}`);
      }
      const data = await res.json();
      const allVideos: Video[] = data.videos || [];
      
      // Update videos array - this will automatically update the wheel slices
      setVideos(allVideos);
      
      // If videos were added/removed and we're not spinning, reset selection
      if (!isSpinning) {
        setSelectedVideoIndex(null);
        setPreviewVideoIndex(null);
      }
    } catch (err) {
      console.error("Error loading videos for circle test:", err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch videos once on mount
    fetchVideos();
  }, []);

  // Number of slices equals number of videos (one slice per video)
  // This is the single source of truth: videos array = wheel slices
  const sliceCount = videos.length;

  // Reset selection if selected video no longer exists (e.g., after delete)
  useEffect(() => {
    if (selectedVideoIndex != null && selectedVideoIndex >= videos.length) {
      setSelectedVideoIndex(null);
      setPreviewVideoIndex(null);
    }
  }, [videos.length, selectedVideoIndex]);

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
        opacity: 1;
        box-shadow: 0 0 8px rgba(249, 115, 22, 0.8), 0 0 16px rgba(249, 115, 22, 0.6), 0 0 24px rgba(249, 115, 22, 0.4);
        animation: casinoLightChase 1.2s ease-in-out infinite;
      }
      
      @keyframes casinoLightChase {
        0% {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(0.8);
          box-shadow: 0 0 4px rgba(249, 115, 22, 0.4), 0 0 8px rgba(249, 115, 22, 0.2);
        }
        25% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.3);
          box-shadow: 0 0 12px rgba(249, 115, 22, 1), 0 0 20px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.6);
        }
        50% {
          opacity: 0.8;
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.8), 0 0 16px rgba(249, 115, 22, 0.6);
        }
        75% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.4);
          box-shadow: 0 0 14px rgba(249, 115, 22, 1), 0 0 24px rgba(249, 115, 22, 0.9), 0 0 36px rgba(249, 115, 22, 0.7);
        }
        100% {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(0.8);
          box-shadow: 0 0 4px rgba(249, 115, 22, 0.4), 0 0 8px rgba(249, 115, 22, 0.2);
        }
      }
      
      /* Selected slice highlighting styles */
      .slice--selected {
        filter: brightness(1.15) saturate(1.2);
      }
      
      .slice-image--selected {
        filter: brightness(1.1) contrast(1.1);
        box-shadow: 0 0 24px rgba(255, 255, 255, 0.7), inset 0 0 40px rgba(239, 68, 68, 0.2);
      }
      
      /* CRT thumbnail selected state - subtle pulse when winner is selected */
      .crt-thumbnail--selected {
        animation: crtPulse 0.6s ease-out;
      }
      
      @keyframes crtPulse {
        0% {
          transform: scale(1);
          filter: brightness(1);
        }
        50% {
          transform: scale(1.02);
          filter: brightness(1.15);
        }
        100% {
          transform: scale(1);
          filter: brightness(1);
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

  // Memoize slice geometry calculations (heavy math, only recalc when videos.length changes)
  const slices: SliceInfo[] = useMemo(() => {
    if (sliceCount === 0) return [];
    
    const anglePerSlice = 360 / sliceCount;

    // Simple circus-inspired pastel palette for placeholder wedges (fallback if no video thumbnail)
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

    return Array.from({ length: sliceCount }).map((_, index) => {
      const startAngle = -90 + index * anglePerSlice; // Start from top
      const endAngle = startAngle + anglePerSlice;
      const clipPath = createSliceClipPath(startAngle, endAngle);
      const color = COLORS[index % COLORS.length];

      // Each slice maps directly to videos[index] (1:1 mapping, one slice per video)
      return { index, clipPath, color, videoIndex: index };
    });
  }, [sliceCount]);

  /**
   * Calculate which slice (and thus which video index in wheelVideos) is aligned with the bottom pointer
   * Returns the index in wheelVideos array (0 to sliceCount-1)
   */
  const getVideoIndexAtPointer = useMemo(() => {
    if (sliceCount === 0) return () => null;
    
    const anglePerSlice = 360 / sliceCount;
    
    return (currentRotation: number): number | null => {
      let closestIndex = 0;
      let minDistance = Infinity;

      // Normalize rotation to 0-360 range first (handles large values like 1980 degrees)
      const normalizedRotation = ((currentRotation % 360) + 360) % 360;

      for (let i = 0; i < sliceCount; i++) {
        const startAngle = -90 + i * anglePerSlice;
        const centerAngle = startAngle + anglePerSlice / 2;
        // Calculate where this slice's center is after rotation
        // Add normalized rotation to center angle, then normalize result to 0-360
        let rotatedCenter = normalizedRotation + centerAngle;
        // Normalize to 0-360 range
        while (rotatedCenter < 0) rotatedCenter += 360;
        while (rotatedCenter >= 360) rotatedCenter -= 360;
        
        // Calculate distance to pointer (90 degrees = bottom)
        const distance = Math.min(
          Math.abs(rotatedCenter - POINTER_ANGLE),
          360 - Math.abs(rotatedCenter - POINTER_ANGLE)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }

      return closestIndex;
    };
  }, [sliceCount]);

  // Determine which video to show in the CRT player
  // During spin: show previewVideoIndex, after spin: show selectedVideoIndex
  // Maps directly to videos[index]
  const activeVideo = useMemo(() => {
    if (isSpinning && previewVideoIndex != null && videos[previewVideoIndex]) {
      return videos[previewVideoIndex];
    }
    if (selectedVideoIndex != null && videos[selectedVideoIndex]) {
      return videos[selectedVideoIndex];
    }
    // Default to first video if available
    return videos[0] || null;
  }, [isSpinning, previewVideoIndex, selectedVideoIndex, videos]);

  // Reset video playing state when activeVideo changes
  useEffect(() => {
    if (activeVideo && !isSpinning) {
      // Reset playing state when video changes - user must click play to load
      setIsCrtPlaying(false);
    }
  }, [activeVideo?.id, isSpinning]); // Only reset when video ID changes AND spin is complete

  // Handle play button click - show video (Vimeo only)
  const handleCrtPlay = () => {
    if (!activeVideo || isSpinning) return; // Prevent loading during spin
    
    // Only play if video has Vimeo ID
    if (activeVideo.vimeo_id) {
      setIsCrtPlaying(true);
    }
  };

  // Spin wheel logic: ensures selected slice center lands exactly at the pointer
  const spinWheel = () => {
    if (isSpinning || sliceCount === 0) return;

    // Mark that wheel has been spun - stop static video
    setHasSpunOnce(true);
    
    // Stop static video if playing
    if (staticVideoRef.current) {
      staticVideoRef.current.pause();
      staticVideoRef.current.currentTime = 0;
    }
    
    // Start tracking wheel for real-time clicks
    startSpinSoundTracking();

    setIsSpinning(true);
    setSelectedVideoIndex(null);
    setPreviewVideoIndex(null);
    // Clear video playing state during spin to prevent any video loading during animation
    setIsCrtPlaying(false);

    // Constants: slice angle and number of full spins for visual effect
    const sliceAngle = 360 / sliceCount;
    const spins = 5; // Number of full rotations for visual effect
    
    // Randomly select the winning slice index (0 to sliceCount-1)
    const winningIndex = Math.floor(Math.random() * sliceCount);
    
    // Store winning index for use in transitionend handler
    winningIndexRef.current = winningIndex;
    
    // Calculate the center angle of the winning slice in wheel's local coordinates
    // Slices start at -90 degrees (top), so:
    // - Slice 0 center: -90 + sliceAngle/2
    // - Slice 1 center: -90 + sliceAngle + sliceAngle/2
    // - Slice i center: -90 + i * sliceAngle + sliceAngle/2
    const sliceCenterAngle = -90 + winningIndex * sliceAngle + sliceAngle / 2;
    
    // The pointer is fixed at the bottom (90 degrees in rotated coordinates)
    // Coordinate system: slices start at -90 (top), rotate clockwise
    // After CSS rotation R, slice center absolute position: (sliceCenterAngle + R) % 360
    // Where: 0=right, 90=bottom, 180=left, 270=top
    // We want: (sliceCenterAngle + R) % 360 = 90 (bottom/pointer)
    // Solving: R % 360 = (90 - sliceCenterAngle) % 360
    
    // Convert slice center to 0-360 range (add 360 if negative)
    let normalizedSliceCenter = sliceCenterAngle;
    while (normalizedSliceCenter < 0) normalizedSliceCenter += 360;
    while (normalizedSliceCenter >= 360) normalizedSliceCenter -= 360;
    
    // Calculate what rotation mod 360 we need to align slice center with pointer
    // Pointer is at 90 degrees (bottom)
    let targetRotationMod = (POINTER_ANGLE - normalizedSliceCenter + 360) % 360;
    
    // Get current rotation normalized to 0-360 range
    const currentMod = ((rotation % 360) + 360) % 360;
    
    // Calculate the extra rotation needed from current position
    // This will make the slice center align with the bottom pointer (90 degrees)
    let extra = targetRotationMod - currentMod;
    if (extra < 0) extra += 360;
    
    // Final rotation: current + full spins + adjustment
    const finalRotation = rotation + spins * 360 + extra;

    // Store final rotation for use in transitionend handler
    finalRotationRef.current = finalRotation;

    // Use requestAnimationFrame to ensure transition is applied before rotation change
    requestAnimationFrame(() => {
      setRotation(finalRotation);
    });

    // Handle animation end using transitionend event (more reliable than setTimeout)
    // The timeout is a fallback in case transitionend doesn't fire
    const timeoutId = setTimeout(() => {
      handleSpinEnd();
    }, 4600);

    // Store timeout ID to clear if transitionend fires first
    if (wheelRef.current) {
      (wheelRef.current as any)._spinTimeoutId = timeoutId;
    }
  };

  // Handle spin animation end - mark the winner
  // Calculate which slice is actually at the pointer using the final rotation
  const handleSpinEnd = () => {
    if (!isSpinning) return; // Guard against multiple calls
    
    // Use the stored final rotation to calculate which slice is at the pointer
    // This ensures we use the exact rotation value that was set
    const finalRotation = finalRotationRef.current;
    
    if (finalRotation === null) {
      // Fallback: use stored winner index
      const winner = winningIndexRef.current;
      if (winner !== null) {
        setIsSpinning(false);
        setSelectedVideoIndex(winner);
        setPreviewVideoIndex(winner);
        winningIndexRef.current = null;
        finalRotationRef.current = null;
        
        // Play final click sound (same as regular clicks)
        playClickSound();
      }
      return;
    }
    
    // Calculate which slice is actually at the pointer position (90 degrees = bottom)
    // Normalize the final rotation first to ensure accurate calculation
    const normalizedFinalRotation = ((finalRotation % 360) + 360) % 360;
    const actualSliceAtPointer = getVideoIndexAtPointer(normalizedFinalRotation);
    
    // Use the calculated slice at pointer - this is the slice actually under the red arrow
    // This ensures the highlighted slice matches the video shown in CRT
    const winner = actualSliceAtPointer !== null ? actualSliceAtPointer : winningIndexRef.current;
    
    if (winner !== null && winner >= 0 && winner < videos.length) {
      setIsSpinning(false);
      // Set the selected index - this will:
      // 1. Highlight the slice at the pointer (isSelected = true for that slice)
      // 2. Show that video in the CRT (activeVideo = videos[selectedVideoIndex])
      setSelectedVideoIndex(winner);
      setPreviewVideoIndex(winner);
      winningIndexRef.current = null;
      finalRotationRef.current = null;
      
      // Play final click sound (same as regular clicks)
      playClickSound();
    }
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

  // Update preview video index during spin by reading actual DOM transform
  // Also play click sounds in real-time as wheel rotates
  // This shows which video is currently under the bottom pointer as the wheel spins
  useEffect(() => {
    if (!isSpinning || sliceCount === 0 || !wheelRef.current) {
      if (!isSpinning) {
        // Clear preview when not spinning
        setPreviewVideoIndex(null);
        lastClickAngleRef.current = null;
        lastClickTimeRef.current = 0;
      }
      return;
    }

    let rafId: number;
    const updatePreview = () => {
      if (!wheelRef.current || !isSpinning) return;
      
      // Read the computed transform from the DOM (this reflects the CSS transition)
      const computedStyle = window.getComputedStyle(wheelRef.current);
      const transform = computedStyle.transform;
      
      if (transform && transform !== 'none') {
        // Parse matrix values: matrix(cos, sin, -sin, cos, tx, ty)
        // For rotation, we can extract the angle from the matrix
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
          // Calculate rotation angle from matrix
          // For 2D rotation: cos = values[0], sin = values[1]
          const angleRad = Math.atan2(values[1], values[0]);
          const angleDeg = (angleRad * 180) / Math.PI;
          // Normalize to 0-360
          const normalizedAngle = angleDeg < 0 ? angleDeg + 360 : angleDeg;
          
          // Play click sounds based on actual rotation progress
          // Play a click every time we pass a slice notch (every ~sliceAngle degrees)
          if (sliceCount > 0) {
            const sliceAngle = 360 / sliceCount;
            const lastAngle = lastClickAngleRef.current;
            
            if (lastAngle !== null) {
              // Calculate how much we've rotated since last check
              let angleDiff = normalizedAngle - lastAngle;
              
              // Handle wrap-around (360 -> 0 transition)
              if (angleDiff < -180) angleDiff += 360;
              if (angleDiff > 180) angleDiff -= 360;
              
              // Only play click if we've rotated past a slice boundary
              // Use higher threshold and time-based throttling to prevent rapid clicking
              const threshold = sliceAngle * 0.85; // Require 85% of slice angle
              const now = Date.now();
              
              // Check both angle threshold AND minimum time between clicks
              if (Math.abs(angleDiff) >= threshold && (now - lastClickTimeRef.current) >= 60) {
                playClickSound();
                lastClickTimeRef.current = now;
                // Update to the angle we clicked at, not current angle
                // This prevents multiple clicks while still in same slice
                lastClickAngleRef.current = lastAngle + (angleDiff > 0 ? threshold : -threshold);
                // Normalize
                if (lastClickAngleRef.current < 0) lastClickAngleRef.current += 360;
                if (lastClickAngleRef.current >= 360) lastClickAngleRef.current -= 360;
              }
            } else {
              // First frame - initialize
              lastClickAngleRef.current = normalizedAngle;
            }
          }
          
          const currentVideoIndex = getVideoIndexAtPointer(normalizedAngle);
          setPreviewVideoIndex(currentVideoIndex);
        }
      }
      
      if (isSpinning) {
        rafId = requestAnimationFrame(updatePreview);
      }
    };

    // Start updating preview
    rafId = requestAnimationFrame(updatePreview);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isSpinning, sliceCount, getVideoIndexAtPointer]);

  return (
    <main className="circle-test-page min-h-screen w-full flex flex-col items-center justify-between bg-black text-white px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-10 relative overflow-hidden">
      {/* Casino-style lights around the perimeter */}
      <div className="circus-lights-container absolute inset-0 pointer-events-none z-0">
        {/* Top row */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`top-${i}`}
            className={`circus-light absolute top-2 ${isSpinning ? "circus-light--active" : ""}`}
            style={{
              left: `${(i + 1) * (100 / 21)}%`,
              animationDelay: `${i * 0.05}s`,
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
              animationDelay: `${(i + 20) * 0.05}s`,
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
              animationDelay: `${(i + 40) * 0.05}s`,
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
              animationDelay: `${(i + 52) * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Top navigation - centered */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-center mb-3 sm:mb-4 md:mb-6 lg:mb-8 pt-2 sm:pt-3 md:pt-4">
        <nav className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-5 xl:gap-8 text-[9px] sm:text-[10px] md:text-xs lg:text-sm tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] lg:tracking-[0.25em] uppercase flex-wrap justify-center px-2">
          <a
            href="/videos"
            className="group relative inline-flex items-center touch-manipulation min-h-[32px] sm:min-h-[36px]"
          >
            <span className="px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[3px] group-hover:bg-red-500/90 active:bg-red-500 transition-colors">
              <span className="relative z-10 text-white group-hover:text-white">All</span>
            </span>
          </a>
          <a
            href="/videos?category=music-video"
            className="group relative inline-flex items-center touch-manipulation min-h-[32px] sm:min-h-[36px]"
          >
            <span className="px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[3px] group-hover:bg-red-500/90 active:bg-red-500 transition-colors">
              <span className="relative z-10 text-white group-hover:text-white">Music</span>
            </span>
          </a>
          <a
            href="/videos?category=industry-work"
            className="group relative inline-flex items-center touch-manipulation min-h-[32px] sm:min-h-[36px]"
          >
            <span className="px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[3px] group-hover:bg-red-500/90 active:bg-red-500 transition-colors">
              <span className="relative z-10 text-white group-hover:text-white hidden sm:inline">Launch Videos</span>
              <span className="relative z-10 text-white group-hover:text-white sm:hidden">Launch</span>
            </span>
          </a>
          <a
            href="/videos?category=clothing"
            className="group relative inline-flex items-center touch-manipulation min-h-[32px] sm:min-h-[36px]"
          >
            <span className="px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[3px] group-hover:bg-red-500/90 active:bg-red-500 transition-colors">
              <span className="relative z-10 text-white group-hover:text-white">Clothing</span>
            </span>
          </a>
          <a
            href="/videos?category=live-events"
            className="group relative inline-flex items-center touch-manipulation min-h-[32px] sm:min-h-[36px]"
          >
            <span className="px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[3px] group-hover:bg-red-500/90 active:bg-red-500 transition-colors">
              <span className="relative z-10 text-white group-hover:text-white hidden sm:inline">LIVE EVENTS</span>
              <span className="relative z-10 text-white group-hover:text-white sm:hidden">Events</span>
            </span>
          </a>
          <a
            href="/videos?category=bts"
            className="group relative inline-flex items-center touch-manipulation min-h-[32px] sm:min-h-[36px]"
          >
            <span className="px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-[3px] group-hover:bg-red-500/90 active:bg-red-500 transition-colors">
              <span className="relative z-10 text-white group-hover:text-white">BTS</span>
            </span>
          </a>
        </nav>
      </header>


      {loading ? (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🎪</div>
          </div>
        </div>
      ) : !slices.length ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          <div className="text-center">
            <p className="text-lg text-gray-200 mb-2">No videos available</p>
            <p className="text-xs text-gray-400 uppercase tracking-[0.25em]">
              Upload videos in the admin panel to populate this circle
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 sc-page w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-24 flex-1 py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-4">
          {/* Left side: lever + wheel in a row */}
          <div className="sc-left flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 flex-shrink-0">
            {/* Lever with spin indication */}
            <div className="flex flex-col items-center gap-2">
              {/* Minimal lever on the left */}
              <div
                className={`lever-mount relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] flex items-center justify-start cursor-pointer min-h-[44px] min-w-[44px] touch-manipulation ${
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
              {/* Spin indication label */}
              <div className="text-center">
                <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {isMobile ? 'Tap to Spin' : 'Pull to Spin'}
                </div>
              </div>
            </div>

            {/* WHEEL COLUMN (right of lever) */}
            <div className="wheel-column flex flex-col items-center justify-center flex-shrink-0">
              <div
                ref={wheelRef}
                className="circle-wrapper relative rounded-full overflow-hidden border-2 border-gray-300 shadow-[0_20px_60px_rgba(15,23,42,0.25)] bg-white"
                onTransitionEnd={(e) => {
                  // Only handle transform transitions (not other CSS properties)
                  // This ensures the winner is set when the spin animation completes
                  if (e.propertyName === 'transform' && isSpinning && e.target === wheelRef.current) {
                    // Clear the timeout fallback
                    const timeoutId = (wheelRef.current as any)?._spinTimeoutId;
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                      delete (wheelRef.current as any)?._spinTimeoutId;
                    }
                    
                    // Read the actual final rotation from the DOM to ensure accuracy
                    // This accounts for any CSS rounding or adjustment
                    if (wheelRef.current) {
                      const computedStyle = window.getComputedStyle(wheelRef.current);
                      const transform = computedStyle.transform;
                      if (transform && transform !== 'none') {
                        const matrix = transform.match(/matrix\(([^)]+)\)/);
                        if (matrix) {
                          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                          // Extract rotation angle from matrix (cos, sin, -sin, cos, tx, ty)
                          const angleRad = Math.atan2(values[1], values[0]);
                          let angleDeg = (angleRad * 180) / Math.PI;
                          // Normalize to 0-360, but preserve the full rotation for calculation
                          // We'll use the stored finalRotationRef value which has the full rotation
                        }
                      }
                    }
                    
                    // Mark spin as complete - handleSpinEnd will calculate winner from final rotation
                    handleSpinEnd();
                  }
                }}
                style={{
                  width: isMobile ? "min(70vw, 320px)" : "520px",
                  height: isMobile ? "min(70vw, 320px)" : "520px",
                  maxWidth: isMobile ? "min(70vw, 320px)" : "min(65vmin, 520px)",
                  maxHeight: isMobile ? "min(70vw, 320px)" : "min(65vmin, 520px)",
                  aspectRatio: "1 / 1",
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? "transform 4.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    : "transform 0.3s ease-out",
                  willChange: isSpinning ? "transform" : "auto",
                }}
              >
                {/* Slices - one per video */}
                {slices.map(({ videoIndex, index, clipPath, color }) => {
                  // videoIndex is the index in videos array (same as slice index)
                  // Maps directly to videos[videoIndex]
                  const video = videoIndex !== null ? videos[videoIndex] : null;
                  
                  // Safety check: if video doesn't exist, show placeholder
                  if (!video) {
                    return (
                      <div
                        key={`slice-empty-${index}`}
                        className="circle-slice absolute inset-0"
                        style={{
                          WebkitClipPath: clipPath,
                          clipPath,
                          backgroundColor: '#e5e7eb',
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400 opacity-50">#{index + 1}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  const isHovered = hoveredIndex === index;
                  // Selected if this slice's video index matches selectedVideoIndex (winner)
                  const isSelected = selectedVideoIndex === videoIndex && !isSpinning;
                  
                  // BANDWIDTH-SAFE: Use thumbnail_url if available, fallback to Vimeo thumbnail if vimeo_id exists
                  // Slices should NEVER use <video> elements - only small image thumbnails (JPG/PNG/WebP)
                  // This prevents downloading full video files for every slice in the wheel
                  const thumbnailUrl = getVideoThumbnail(video);

                  return (
                    <button
                      key={`slice-${video.id}-${index}`}
                      type="button"
                      onClick={() => {
                        if (isSpinning) return;
                        // Set selectedVideoIndex directly (single source of truth)
                        // This maps directly to videos[selectedVideoIndex]
                        setSelectedVideoIndex(videoIndex);
                        setPreviewVideoIndex(videoIndex);
                      }}
                      onMouseEnter={() => !isSpinning && setHoveredIndex(index)}
                      onMouseLeave={() => !isSpinning && setHoveredIndex(null)}
                      className={[
                        "circle-slice absolute inset-0 group transition-all duration-200 ease-out",
                        isHovered && !isSpinning ? "scale-[1.02] z-10" : "",
                        isSelected ? "slice--selected scale-[1.05] z-20" : "",
                        isSpinning ? "pointer-events-none" : "cursor-pointer",
                      ].join(" ")}
                      style={{
                        WebkitClipPath: clipPath,
                        clipPath,
                      }}
                    >
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={video.title || `Video ${index + 1}`}
                          className={[
                            "circle-slice-image w-full h-full object-cover block transition-all duration-300 ease-out",
                            isSelected ? "slice-image--selected" : "group-hover:scale-[1.05]",
                          ].join(" ")}
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to neutral gray if thumbnail fails
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-placeholder')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gray-200';
                              fallback.style.backgroundColor = '#e5e7eb';
                              const text = document.createElement('span');
                              text.className = 'text-xs text-gray-400 opacity-50';
                              text.textContent = video.title ? video.title.substring(0, 10) : `#${index + 1}`;
                              fallback.appendChild(text);
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        // Neutral gray placeholder if no thumbnail - show title
                        <div
                          className="w-full h-full flex items-center justify-center bg-gray-200"
                          style={{
                            backgroundColor: '#e5e7eb',
                          }}
                        >
                          <span className="text-xs text-gray-600 opacity-70 px-2 text-center truncate max-w-full">
                            {video.title ? video.title.substring(0, 15) : `Video ${index + 1}`}
                          </span>
                        </div>
                      )}
                      {/* Selected state overlay - enhanced highlighting for winner */}
                      {isSelected && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Pulsing glow overlay */}
                          <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                          {/* Bright border glow */}
                          <div className="absolute inset-0 border-4 border-red-500/60 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.9),inset_0_0_20px_rgba(239,68,68,0.3)]" 
                            style={{
                              WebkitClipPath: clipPath,
                              clipPath,
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Optional inner ring for structure */}
                <div className="pointer-events-none absolute inset-[6%] rounded-full border border-white/80" />
              </div>

              {/* Pointer at the bottom indicating selection */}
              <div className="wheel-pointer pointer-events-none mt-2 relative z-30">
                <div className="wheel-pointer-bottom w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-red-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
              </div>
              
              {/* Selected video title display below wheel */}
              {selectedVideoIndex != null && videos[selectedVideoIndex] && !isSpinning && (
                <div className="mt-3 sm:mt-4 text-center max-w-md px-2">
                  <h3 className={`${isMobile ? 'text-sm sm:text-base' : 'text-lg'} font-semibold text-white mb-1`}>
                    {videos[selectedVideoIndex].title}
                  </h3>
                  {videos[selectedVideoIndex].description && (
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300 line-clamp-2`}>
                      {videos[selectedVideoIndex].description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column: CRT TV that plays the selected video */}
          <div className="sc-right flex items-center justify-center flex-shrink-0 w-full lg:w-auto">
            <div className="crt-shell flex flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full max-w-[90vw] sm:max-w-[85vw] md:max-w-none">
              {/* CRT TV Frame - Enhanced */}
              <div className="crt-frame relative rounded-[28px] sm:rounded-[32px] md:rounded-[36px] bg-[linear-gradient(135deg,#555_0%,#222_50%,#111_100%)] p-4 sm:p-5 md:p-6 lg:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] w-full border-2 border-gray-800/50">
                {/* Brand Logo Area */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                  <div className="px-3 py-0.5 bg-black/60 rounded-full border border-gray-700/50">
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-300 tracking-wider">CIRCUS17</span>
                  </div>
                </div>
                
                {/* Screen Bezel */}
                <div className={`crt-screen relative ${isMobile ? 'w-full max-w-[85vw]' : 'w-[320px] md:w-[420px] lg:w-[500px]'} aspect-[4/3] bg-black rounded-[10px] sm:rounded-[12px] md:rounded-[14px] lg:rounded-[16px] overflow-hidden border-[4px] sm:border-[6px] md:border-[8px] border-[#1a1a1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.95),0_0_20px_rgba(0,0,0,0.8)] flex-shrink-0 mx-auto mt-2 sm:mt-3 md:mt-4`} style={{
                  boxShadow: 'inset 0 0 50px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.5)'
                }}>
                  {/* Screen Glass Reflection Effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] pointer-events-none z-20" />
                  
                  {/* CRT Screen Curvature Effect (subtle) */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none z-15" />
                  
                  {!hasSpunOnce ? (
                    // Show TV static video until first spin
                    <video
                      ref={staticVideoRef}
                      src={STATIC_VIDEO_URL}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : activeVideo ? (
                    <>
                      {/* Always show thumbnail first - no video loading until play is clicked */}
                      {!isCrtPlaying ? (
                        // Show thumbnail (no video bytes downloaded)
                        <div className="relative w-full h-full">
                          {getVideoThumbnail(activeVideo) ? (
                            <img
                              key={`thumbnail-${activeVideo.id}-${selectedVideoIndex}`}
                              src={getVideoThumbnail(activeVideo)!}
                              alt={activeVideo.title}
                              className={`crt-video w-full h-full object-cover relative z-0 transition-all duration-500 ${
                                selectedVideoIndex !== null && !isSpinning ? 'crt-thumbnail--selected' : ''
                              }`}
                            />
                          ) : (
                            <div className="crt-placeholder w-full h-full flex items-center justify-center text-sm text-gray-400 relative z-0">
                              {activeVideo.title}
                            </div>
                          )}
                          {/* Play button overlay */}
                          {selectedVideoIndex != null && !isSpinning && (
                            <button
                              onClick={handleCrtPlay}
                              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/30 active:bg-black/40 transition-colors group touch-manipulation min-h-[44px] min-w-[44px]"
                              aria-label="Play video"
                            >
                              <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} bg-white/90 hover:bg-white active:bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-105 transition-transform`}>
                                <svg className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-black ml-1`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          )}
                        </div>
                      ) : (
                        // Video Player - Vimeo only
                        activeVideo.vimeo_id ? (
                          <VimeoPlayer
                            videoId={activeVideo.vimeo_id}
                            hash={activeVideo.vimeo_hash || null}
                            autoplay
                            muted={false}
                            loop={false}
                            className="w-full h-full"
                            aspectRatio="4/3"
                            onPause={() => setIsCrtPlaying(false)}
                            onEnded={() => setIsCrtPlaying(false)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black/50 text-white text-sm p-4 text-center">
                            <p>No Vimeo ID available for this video.</p>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <div className="crt-placeholder w-full h-full flex items-center justify-center text-sm text-gray-400 relative z-0">
                      Spin the wheel to pick a video
                    </div>
                  )}
                  
                  {/* Scanline overlay - Enhanced */}
                  <div className="crt-scanlines pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_3px)] mix-blend-soft-light z-25" />
                  
                  {/* Screen Corner Details */}
                  <div className="absolute top-2 left-2 w-1 h-1 bg-white/20 rounded-full z-30" />
                  <div className="absolute top-2 right-2 w-1 h-1 bg-white/20 rounded-full z-30" />
                </div>
              </div>
              {/* CRT controls - Clean Navigation Buttons */}
              <div className="crt-controls flex items-center justify-center gap-3 sm:gap-4 md:gap-5 w-full mt-2 px-2">
                {/* Left Arrow Button */}
                {activeVideo && selectedVideoIndex != null && !isSpinning ? (
                  <button
                    onClick={() => {
                      if (selectedVideoIndex > 0) {
                        const prevIndex = selectedVideoIndex - 1
                        setSelectedVideoIndex(prevIndex)
                        setPreviewVideoIndex(prevIndex)
                      }
                    }}
                    disabled={selectedVideoIndex === 0}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-600 hover:border-gray-500 transition-all duration-200 active:scale-95 flex items-center justify-center touch-manipulation min-h-[44px] min-w-[44px]"
                    title="Previous video"
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : (
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full bg-gray-900 border border-gray-700 opacity-50`} />
                )}
                
                {/* Right Arrow Button */}
                {activeVideo && selectedVideoIndex != null && !isSpinning ? (
                  <button
                    onClick={() => {
                      if (selectedVideoIndex < videos.length - 1) {
                        const nextIndex = selectedVideoIndex + 1
                        setSelectedVideoIndex(nextIndex)
                        setPreviewVideoIndex(nextIndex)
                      }
                    }}
                    disabled={selectedVideoIndex === videos.length - 1}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-600 hover:border-gray-500 transition-all duration-200 active:scale-95 flex items-center justify-center touch-manipulation min-h-[44px] min-w-[44px]"
                    title="Next video"
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full bg-gray-900 border border-gray-700 opacity-50`} />
                )}
              </div>
              
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
