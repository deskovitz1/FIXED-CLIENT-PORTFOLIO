"use client"

import { useEffect, useState, useRef } from "react"
import { Video } from "@/lib/db"
import { VideoPlayer } from "@/components/video-player"
import { Play, AlertCircle, Edit2, Trash2, Save, XCircle, Plus, Upload, Image, ChevronUp, ChevronDown, X, Menu } from "lucide-react"
import { upload } from '@vercel/blob/client'
import { useAdmin } from "@/contexts/AdminContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { parseVimeoUrl } from "@/lib/vimeo-url-parser"
import { getVideoThumbnail } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface VideoHomepageProps {
  initialCategory?: string
}

interface FeaturedVideoItemProps {
  video: Video
  onChanged: () => void
  onVideoClick: () => void
  videoRefs: React.MutableRefObject<Map<number, HTMLVideoElement>>
  onVideoLoad: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  onVideoError: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  formatDate: (dateString: string) => string
  onReorder?: (videoId: number, direction: 'up' | 'down') => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (videoId: number) => void
  onDragOver?: (e: React.DragEvent, videoId: number) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent, videoId: number) => void
  onDragEnd?: () => void
}

const CATEGORIES = [
  { value: null, label: 'None (No Category)' },
  { value: 'music-video', label: 'MUSIC' },
  { value: 'industry-work', label: 'LAUNCH VIDEOS' },
  { value: 'clothing', label: 'CLOTHING' },
  { value: 'live-events', label: 'LIVE EVENTS' },
  { value: 'bts', label: 'BTS' },
]

// Mobile Navigation Menu Component
function MobileNavMenu({ selectedCategory }: { selectedCategory: string | null }) {
  const isMobile = useIsMobile()
  
  if (!isMobile) return null
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-black border-gray-800">
        <div className="flex flex-col gap-4 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Navigation</h2>
          <a
            href="/videos"
            className={`px-4 py-3 rounded-lg text-base transition-colors touch-manipulation ${
              selectedCategory === null
                ? "bg-red-600 text-white"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            All Videos
          </a>
          <a
            href="/videos?category=music-video"
            className={`px-4 py-3 rounded-lg text-base transition-colors touch-manipulation ${
              selectedCategory === "music-video"
                ? "bg-red-500 text-white"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            MUSIC
          </a>
          <a
            href="/videos?category=industry-work"
            className={`px-4 py-3 rounded-lg text-base transition-colors touch-manipulation ${
              selectedCategory === "industry-work"
                ? "bg-red-500 text-white"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            LAUNCH VIDEOS
          </a>
          <a
            href="/videos?category=clothing"
            className={`px-4 py-3 rounded-lg text-base transition-colors touch-manipulation ${
              selectedCategory === "clothing"
                ? "bg-red-500 text-white"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            CLOTHING
          </a>
          <a
            href="/videos?category=live-events"
            className={`px-4 py-3 rounded-lg text-base transition-colors touch-manipulation ${
              selectedCategory === "live-events"
                ? "bg-red-500 text-white"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            LIVE EVENTS
          </a>
          <a
            href="/videos?category=bts"
            className={`px-4 py-3 rounded-lg text-base transition-colors touch-manipulation ${
              selectedCategory === "bts"
                ? "bg-red-500 text-white"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            BTS
          </a>
          <div className="border-t border-gray-800 mt-4 pt-4">
            <a
              href="/menu"
              className="px-4 py-3 rounded-lg text-base text-gray-200 hover:bg-white/10 transition-colors touch-manipulation block"
            >
              Menu
            </a>
            <a
              href="/contact"
              className="px-4 py-3 rounded-lg text-base text-gray-200 hover:bg-white/10 transition-colors touch-manipulation block"
            >
              Contact
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Helper function to format category for display
function formatCategory(category: string | null): string {
  if (!category) return ''
  const cat = CATEGORIES.find(c => c.value === category)
  return cat ? cat.label : category.toUpperCase().replace(/-/g, ' ')
}

function FeaturedVideoItem({ video, onChanged, onVideoClick, videoRefs, onVideoLoad, onVideoError, formatDate, onReorder, canMoveUp, canMoveDown, isDragging, isDragOver, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }: FeaturedVideoItemProps) {
  const { isAdmin } = useAdmin()
  const isMobile = useIsMobile()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [category, setCategory] = useState(video.category || null)
  const [displayDate, setDisplayDate] = useState(video.display_date ? video.display_date.split('T')[0] : '')
  const [vimeoId, setVimeoId] = useState(video.vimeo_id || '')
  const [vimeoHash, setVimeoHash] = useState(video.vimeo_hash || '')
  const [saving, setSaving] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Sync form state when video prop changes or editing starts
  useEffect(() => {
    if (editing) {
      setTitle(video.title)
      setDescription(video.description ?? '')
      setCategory(video.category || null)
      setDisplayDate(video.display_date ? video.display_date.split('T')[0] : '')
      setVimeoId(video.vimeo_id || '')
      setVimeoHash(video.vimeo_hash || '')
      console.log('[FeaturedVideoItem] Form state synced for editing:', {
        id: video.id,
        vimeo_id: video.vimeo_id,
        vimeo_hash: video.vimeo_hash
      })
    }
  }, [editing, video.id, video.vimeo_id, video.vimeo_hash])

  async function save() {
    setSaving(true)
    try {
      console.log('[FeaturedVideoItem] Saving video:', {
        id: video.id,
        title,
        display_date: displayDate || null,
        vimeo_id: vimeoId || null,
        vimeo_hash: vimeoHash || null
      });
      
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          category,
          display_date: displayDate || null,
          vimeo_id: vimeoId || null,
          vimeo_hash: vimeoHash || null
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[FeaturedVideoItem] Save failed:', err);
        alert(`Failed to save: ${err.error || err.details || res.status}`)
        return
      }

      const result = await res.json();
      console.log('[FeaturedVideoItem] Save successful:', result);
      console.log('[FeaturedVideoItem] Updated video display_date:', result.video?.display_date);
      
      // Check if date was requested but not saved
      if (displayDate && !result.video?.display_date && result.warning) {
        alert(
          `Warning: Date field may not be saved. The display_date column doesn't exist in your Prisma Postgres database.\n\n` +
          `To fix this, sync your Prisma schema:\n\n` +
          `1. Run: npm run db:push\n` +
          `2. Run: npm run db:generate\n` +
          `3. Restart your dev server\n` +
          `4. Try saving the date again\n\n` +
          `See DEV_SETUP.md or PRISMA_SETUP.md for details.`
        );
      }
      
      // Update local state with the returned video data
      if (result.video) {
        const savedDate = result.video.display_date ? result.video.display_date.split('T')[0] : '';
        console.log('[FeaturedVideoItem] Setting displayDate to:', savedDate);
        setDisplayDate(savedDate);
        
        // Update vimeoId and vimeoHash from saved video
        const savedVimeoId = result.video.vimeo_id || '';
        const savedVimeoHash = result.video.vimeo_hash || '';
        console.log('[FeaturedVideoItem] Setting vimeoId to:', savedVimeoId, 'vimeoHash to:', savedVimeoHash);
        setVimeoId(savedVimeoId);
        setVimeoHash(savedVimeoHash);
      }
      
      setEditing(false)
      // Force refresh the video list to get updated sorting
      setTimeout(() => {
        onChanged()
      }, 300);
    } catch (error) {
      console.error('[FeaturedVideoItem] Save error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.')
      return
    }

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/videos/${video.id}/thumbnail`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to upload thumbnail: ${err.error || err.details || res.status}`)
        return
      }

      onChanged()
    } catch (error) {
      alert(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingThumbnail(false)
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = ''
      }
    }
  }

  async function remove() {
    if (!confirm('Delete this video? This will remove it from the site.')) return

    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to delete: ${err.error || err.details || res.status}`)
        return
      }

      onChanged()
    } catch (error) {
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const videoUrl = video.video_url || video.blob_url

  if (editing) {
    return (
      <div className="flex-1 lg:max-w-[70%] w-full">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-base text-gray-100 focus:outline-none focus:border-red-500"
            placeholder="Video title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 resize-none"
            rows={4}
            placeholder="Video description (optional)"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Display Date (for sorting - most recent appears first)
            </label>
            <input
              type="date"
              value={displayDate}
              onChange={(e) => setDisplayDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Vimeo URL or ID (optional - paste full URL or just ID)
            </label>
            <input
              type="text"
              value={vimeoId}
              onChange={(e) => {
                const value = e.target.value
                // Always try to parse URL - it handles both URLs and plain IDs
                const parsed = parseVimeoUrl(value)
                if (parsed.videoId) {
                  // If we got a parsed ID, use it (extracted from URL or just the ID itself)
                  setVimeoId(parsed.videoId)
                  // Set hash if found, otherwise clear it
                  setVimeoHash(parsed.hash || '')
                } else {
                  // If parsing failed, just use the raw value (might be partial input)
                  setVimeoId(value)
                }
              }}
              placeholder="https://vimeo.com/123456789/ab8ee4cce4 or 123456789"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste full Vimeo URL (e.g., https://vimeo.com/123456789/ab8ee4cce4) or just the ID
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Vimeo Hash (for unlisted videos, optional)
            </label>
            <input
              type="text"
              value={vimeoHash}
              onChange={(e) => setVimeoHash(e.target.value)}
              placeholder="ab8ee4cce4"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Only needed for unlisted videos. Found after the ID in the URL (e.g., /123456789/<strong>ab8ee4cce4</strong>)
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value || null)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value || 'null'} value={cat.value || ''}>
                  {cat.label}
                </option>
              ))}
            </select>
            <label className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <Image className="w-4 h-4" />
              {uploadingThumbnail ? 'Uploading...' : 'Thumbnail'}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
                disabled={uploadingThumbnail}
              />
            </label>
            {getVideoThumbnail(video) && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <img src={getVideoThumbnail(video)!} alt="Thumbnail" className="w-8 h-8 object-cover rounded" />
                <span>Has thumbnail</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              disabled={saving}
              onClick={save}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setTitle(video.title)
                setDescription(video.description ?? '')
                setCategory(video.category || null)
                setDisplayDate(video.display_date ? video.display_date.split('T')[0] : '')
                setVimeoId(video.vimeo_id || '')
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded text-sm flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={remove}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 rounded text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        className={`group cursor-pointer relative transition-all ${
          isDragging ? 'opacity-50 scale-95' : ''
        } ${isDragOver ? 'ring-2 ring-red-500 ring-offset-2 scale-105' : ''}`}
        onClick={onVideoClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
        draggable={isAdmin && onDragStart !== undefined}
        onDragStart={(e) => {
          if (onDragStart) {
            onDragStart(video.id);
            e.dataTransfer.effectAllowed = 'move';
          }
        }}
        onDragOver={(e) => {
          if (onDragOver) {
            onDragOver(e, video.id);
          }
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          if (onDrop) {
            onDrop(e, video.id);
          }
        }}
        onDragEnd={onDragEnd}
      >
        {/* Featured Video Thumbnail */}
        <div className="relative aspect-video rounded-lg overflow-hidden mb-3 sm:mb-4 bg-black">
          {/* Show thumbnail image - video plays in modal via VimeoPlayer */}
          {getVideoThumbnail(video) ? (
            <img
              src={getVideoThumbnail(video)!}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : video.vimeo_id ? (
            // If no thumbnail but has Vimeo ID, we could fetch thumbnail from Vimeo API
            // For now, show placeholder
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <p className="text-gray-400 text-sm">No thumbnail</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-900/30 border-2 border-red-500">
              <div className="text-center p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-red-300">No Vimeo ID</p>
                <p className="text-[10px] text-red-400 mt-1">
                  ID: {video.id}
                </p>
              </div>
            </div>
          )}
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-10 h-10 text-black ml-1" fill="black" />
            </div>
          </div>
          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-sm text-white">
              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>

        {/* Featured Video Info */}
        <div>
          <h2 className={`font-semibold ${isMobile ? 'text-base sm:text-lg' : 'text-lg'} mb-2 text-gray-100 transition-colors group-hover:text-red-300`}>
            {video.title}
          </h2>
          {video.description && (
            <p className={`${isMobile ? 'text-xs sm:text-sm' : 'text-sm'} text-gray-300 line-clamp-3`}>
              {video.description}
            </p>
          )}
        </div>

        {/* Edit/Delete/Reorder Actions */}
        {isAdmin && showActions && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {onReorder && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onReorder(video.id, 'up')
                  }}
                  disabled={!canMoveUp}
                  className="p-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-blue-200 hover:text-blue-100 transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onReorder(video.id, 'down')
                  }}
                  disabled={!canMoveDown}
                  className="p-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-blue-200 hover:text-blue-100 transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
              }}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Edit video"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                remove()
              }}
              className="p-2 bg-red-900 hover:bg-red-800 rounded text-red-300 hover:text-red-100 transition-colors"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface VideoItemProps {
  video: Video
  onChanged: () => void
  onSelect: () => void
  videoRefs: React.MutableRefObject<Map<number, HTMLVideoElement>>
  observerRef: React.MutableRefObject<IntersectionObserver | null>
  onVideoLoad: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  onVideoError: (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => void
  formatDate: (dateString: string) => string
  onReorder?: (videoId: number, direction: 'up' | 'down') => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (videoId: number) => void
  onDragOver?: (e: React.DragEvent, videoId: number) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, videoId: number) => void
  onDragEnd?: () => void
}

function VideoItem({ video, onChanged, onSelect, videoRefs, observerRef, onVideoLoad, onVideoError, formatDate, onReorder, canMoveUp, canMoveDown, isDragging, isDragOver, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }: VideoItemProps) {
  const { isAdmin } = useAdmin()
  const isMobile = useIsMobile()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description ?? '')
  const [category, setCategory] = useState(video.category || null)
  const [displayDate, setDisplayDate] = useState(video.display_date ? video.display_date.split('T')[0] : '')
  const [vimeoId, setVimeoId] = useState(video.vimeo_id || '')
  const [vimeoHash, setVimeoHash] = useState(video.vimeo_hash || '')
  const [saving, setSaving] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Sync form state when video prop changes or editing starts
  useEffect(() => {
    if (editing) {
      setTitle(video.title)
      setDescription(video.description ?? '')
      setCategory(video.category || null)
      setDisplayDate(video.display_date ? video.display_date.split('T')[0] : '')
      setVimeoId(video.vimeo_id || '')
      setVimeoHash(video.vimeo_hash || '')
      console.log('[VideoItem] Form state synced for editing:', {
        id: video.id,
        vimeo_id: video.vimeo_id,
        vimeo_hash: video.vimeo_hash
      })
    }
  }, [editing, video.id, video.vimeo_id, video.vimeo_hash])

  async function save() {
    setSaving(true)
    try {
      console.log('[VideoItem] Saving video:', {
        id: video.id,
        title,
        display_date: displayDate || null,
        vimeo_id: vimeoId || null,
        vimeo_hash: vimeoHash || null
      });
      
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          category,
          display_date: displayDate || null,
          vimeo_id: vimeoId || null,
          vimeo_hash: vimeoHash || null
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[VideoItem] Save failed:', err);
        alert(`Failed to save: ${err.error || err.details || res.status}`)
        return
      }

      const result = await res.json();
      console.log('[VideoItem] Save successful:', result);
      console.log('[VideoItem] Updated video display_date:', result.video?.display_date);
      
      // Check if date was requested but not saved
      if (displayDate && !result.video?.display_date && result.warning) {
        alert(
          `Warning: Date field may not be saved. The display_date column doesn't exist in your Prisma Postgres database.\n\n` +
          `To fix this, sync your Prisma schema:\n\n` +
          `1. Run: npm run db:push\n` +
          `2. Run: npm run db:generate\n` +
          `3. Restart your dev server\n` +
          `4. Try saving the date again\n\n` +
          `See DEV_SETUP.md or PRISMA_SETUP.md for details.`
        );
      }
      
      // Update local state with the returned video data
      if (result.video) {
        const savedDate = result.video.display_date ? result.video.display_date.split('T')[0] : '';
        console.log('[VideoItem] Setting displayDate to:', savedDate);
        setDisplayDate(savedDate);
        
        // Update vimeoId and vimeoHash from saved video
        const savedVimeoId = result.video.vimeo_id || '';
        const savedVimeoHash = result.video.vimeo_hash || '';
        console.log('[VideoItem] Setting vimeoId to:', savedVimeoId, 'vimeoHash to:', savedVimeoHash);
        setVimeoId(savedVimeoId);
        setVimeoHash(savedVimeoHash);
      }
      
      setEditing(false)
      // Force refresh the video list to get updated sorting
      setTimeout(() => {
        onChanged()
      }, 300);
    } catch (error) {
      console.error('[VideoItem] Save error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.')
      return
    }

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/videos/${video.id}/thumbnail`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to upload thumbnail: ${err.error || err.details || res.status}`)
        return
      }

      onChanged()
    } catch (error) {
      alert(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingThumbnail(false)
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = ''
      }
    }
  }

  async function remove() {
    if (!confirm('Delete this video? This will remove it from the site.')) return

    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to delete: ${err.error || err.details || res.status}`)
        return
      }

      onChanged()
    } catch (error) {
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const videoUrl = video.video_url || video.blob_url

  if (editing) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2 sm:p-3 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
          placeholder="Video title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 resize-none"
          rows={3}
          placeholder="Video description (optional)"
        />
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Display Date (for sorting)
          </label>
          <input
            type="date"
            value={displayDate}
            onChange={(e) => setDisplayDate(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-100 focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Vimeo URL or ID (optional)
          </label>
          <input
            type="text"
            value={vimeoId}
            onChange={(e) => {
              const value = e.target.value
              // Always try to parse URL - it handles both URLs and plain IDs
              const parsed = parseVimeoUrl(value)
              if (parsed.videoId) {
                // If we got a parsed ID, use it (extracted from URL or just the ID itself)
                setVimeoId(parsed.videoId)
                // Set hash if found, otherwise clear it
                setVimeoHash(parsed.hash || '')
              } else {
                // If parsing failed, just use the raw value (might be partial input)
                setVimeoId(value)
              }
            }}
            placeholder="https://vimeo.com/123456789/ab8ee4cce4 or 123456789"
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-100 focus:outline-none focus:border-red-500"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            Paste full URL or just ID
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Vimeo Hash (unlisted videos, optional)
          </label>
          <input
            type="text"
            value={vimeoHash}
            onChange={(e) => setVimeoHash(e.target.value)}
            placeholder="ab8ee4cce4"
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-100 focus:outline-none focus:border-red-500"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            Only for unlisted videos
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={category || ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-100 focus:outline-none focus:border-red-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value || 'null'} value={cat.value || ''}>
                {cat.label}
              </option>
            ))}
          </select>
          <label className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50">
            <Image className="w-3 h-3" />
            {uploadingThumbnail ? 'Uploading...' : 'Thumbnail'}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
              disabled={uploadingThumbnail}
            />
          </label>
          {getVideoThumbnail(video) && (
            <img src={getVideoThumbnail(video)!} alt="Thumbnail" className="w-6 h-6 object-cover rounded" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={save}
            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs flex items-center justify-center gap-1"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
            <button
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setTitle(video.title)
                setDescription(video.description ?? '')
                setCategory(video.category || null)
                setDisplayDate(video.display_date ? video.display_date.split('T')[0] : '')
                setVimeoId(video.vimeo_id || '')
              }}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded text-xs flex items-center justify-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              Cancel
            </button>
          <button
            disabled={saving}
            onClick={remove}
            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 rounded text-xs flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group cursor-pointer flex gap-2 sm:gap-3 relative transition-all touch-manipulation ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isDragOver ? 'ring-2 ring-red-500 ring-offset-2 scale-105 bg-red-900/20' : ''}`}
      onClick={onSelect}
      draggable={isAdmin && onDragStart !== undefined}
      onDragStart={(e) => {
        if (onDragStart) {
          onDragStart(video.id);
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      onDragOver={(e) => {
        if (onDragOver) {
          onDragOver(e, video.id);
        }
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (onDrop) {
          onDrop(e, video.id);
        }
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Sidebar Video Thumbnail */}
      <div className={`relative ${isMobile ? 'w-32 sm:w-40' : 'w-40'} h-20 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black`}>
        {/* Show thumbnail image - video plays in modal via VimeoPlayer */}
        {getVideoThumbnail(video) ? (
          <img
            src={getVideoThumbnail(video)!}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : video.vimeo_id ? (
          // If no thumbnail but has Vimeo ID, show placeholder
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <p className="text-gray-400 text-xs">No thumbnail</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-red-900/30">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
        )}
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Play className="w-6 h-6 text-white" fill="white" />
        </div>
        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px]">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Sidebar Video Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium ${isMobile ? 'text-xs sm:text-sm' : 'text-sm'} line-clamp-2 mb-1 text-gray-100 group-hover:text-red-300 transition-colors`}>
          {video.title}
        </h3>
        {video.description && (
          <p className={`${isMobile ? 'text-[10px] sm:text-xs' : 'text-xs'} text-gray-400 line-clamp-2 mb-1.5`}>
            {video.description}
          </p>
        )}
      </div>

      {/* Edit/Delete/Reorder Actions */}
      {isAdmin && showActions && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {onReorder && (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onReorder(video.id, 'up')
                }}
                disabled={!canMoveUp}
                className="p-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-blue-200 hover:text-blue-100 transition-colors"
                title="Move up"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onReorder(video.id, 'down')
                }}
                disabled={!canMoveDown}
                className="p-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-blue-200 hover:text-blue-100 transition-colors"
                title="Move down"
              >
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
            title="Edit video"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              remove()
            }}
            className="p-1.5 bg-red-900 hover:bg-red-800 rounded text-red-300 hover:text-red-100 transition-colors"
            title="Delete video"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function VideoHomepage({ initialCategory }: VideoHomepageProps = {}) {
  const { isAdmin } = useAdmin()
  const isMobile = useIsMobile()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null)
  const [dragOverVideoId, setDragOverVideoId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null)
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null) // MB/s
  const [uploadLoaded, setUploadLoaded] = useState(0) // bytes loaded
  const [uploadTotal, setUploadTotal] = useState(0) // total bytes
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const addVideoFormRef = useRef<HTMLFormElement | null>(null)
  const uploadStartTimeRef = useRef<number | null>(null)
  const uploadAbortControllerRef = useRef<AbortController | null>(null) // For client-side blob upload cancellation
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Fetch videos with initial category if provided
    if (initialCategory) {
      setSelectedCategory(initialCategory)
      fetchVideos(initialCategory)
    } else {
      fetchVideos()
    }
  }, [initialCategory])

  const fetchVideos = async (category?: string) => {
    try {
      setLoading(true)
      const url = category 
        ? `/api/videos?category=${encodeURIComponent(category)}`
        : "/api/videos"
      
      // Disable caching to always get fresh data (visibility changes should be immediate)
      const response = await fetch(url, { cache: 'no-store' })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      let loadedVideos = data.videos || []
      
      // TEMPORARILY DISABLED: Show all videos while we fix visibility
      // TODO: Re-enable after migration: loadedVideos = loadedVideos.filter((v: Video) => v.visible === true)
      
      // Log video dates for debugging
      console.log('[fetchVideos] Videos loaded with dates:', loadedVideos.map((v: Video) => ({
        id: v.id,
        title: v.title,
        display_date: v.display_date,
        created_at: v.created_at
      })));
      
      setVideos(loadedVideos)
      // Set first video as featured (most recent by display_date or created_at)
      // Videos are already sorted by getVideos (display_date DESC, then created_at DESC)
      if (loadedVideos.length > 0) {
        console.log('[fetchVideos] Setting featured video:', {
          id: loadedVideos[0].id,
          title: loadedVideos[0].title,
          display_date: loadedVideos[0].display_date,
          vimeo_id: loadedVideos[0].vimeo_id
        });
        setFeaturedVideo(loadedVideos[0]) // First video is the most recent
      } else {
        setFeaturedVideo(null)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  // BANDWIDTH-SAFE: Removed aggressive featured video preloading
  // Previously called videoEl.load() which downloaded full video file immediately
  // Now videos use preload="none" and only load when user clicks to play
  // This prevents downloading large video files for featured videos that may never be watched
  // useEffect(() => {
  //   if (featuredVideo) {
  //     const videoEl = videoRefs.current.get(featuredVideo.id)
  //     if (videoEl && videoEl.readyState === 0) {
  //       // REMOVED: videoEl.load() - was causing bandwidth waste
  //       // Videos now load only when user explicitly clicks to play
  //     }
  //   }
  // }, [featuredVideo])

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    fetchVideos(category)
  }

  const handleAllVideosClick = () => {
    setSelectedCategory(null)
    fetchVideos()
  }

  const handleVideoChanged = () => {
    console.log('[VideoHomepage] handleVideoChanged called, refreshing video list...');
    // Refetch videos after edit/delete to get updated sorting
    // Add a small delay to ensure database has updated
    setTimeout(() => {
      if (selectedCategory) {
        fetchVideos(selectedCategory)
      } else {
        fetchVideos()
      }
    }, 200);
  }

  const saveVideoOrder = async (videoIds: number[]) => {
    if (!isAdmin) return;
    
    try {
      const res = await fetch('/api/videos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds }),
      });
      
      if (!res.ok) {
        let errorText = '';
        let errorJson: any = {};
        
        try {
          errorText = await res.text();
          errorJson = JSON.parse(errorText);
        } catch (parseError) {
          // Response isn't JSON, use text
          errorJson = { error: errorText || `HTTP ${res.status}` };
        }
        
        console.error('Reorder API error:', {
          status: res.status,
          statusText: res.statusText,
          errorJson,
          errorText
        });
        
        const errorMsg = errorJson.error || errorJson.details || res.statusText || `HTTP ${res.status}`;
        const details = errorJson.details || errorJson.errorCode || '';
        alert(`Failed to reorder: ${errorMsg}${details ? `\n\nDetails: ${details}` : ''}`);
        return;
      }
      
      const result = await res.json();
      console.log('Reorder successful:', result);
      
      // Refresh videos to get updated order
      handleVideoChanged();
    } catch (error) {
      console.error('Reorder error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to reorder: ${errorMsg}`);
    }
  }

  const handleReorder = async (videoId: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    
    const currentIndex = videos.findIndex(v => v.id === videoId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;
    
    // Create new order array
    const newOrder = [...videos];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    // Update sort_order for all videos
    const videoIds = newOrder.map(v => v.id);
    await saveVideoOrder(videoIds);
  }

  // Drag and drop handlers
  const handleDragStart = (videoId: number) => {
    if (!isAdmin) return;
    setDraggedVideoId(videoId);
  }

  const handleDragOver = (e: React.DragEvent, videoId: number) => {
    if (!isAdmin || !draggedVideoId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (videoId !== draggedVideoId) {
      setDragOverVideoId(videoId);
    }
  }

  const handleDragLeave = () => {
    setDragOverVideoId(null);
  }

  const handleDrop = async (e: React.DragEvent, targetVideoId: number) => {
    if (!isAdmin || !draggedVideoId) return;
    e.preventDefault();
    
    if (draggedVideoId === targetVideoId) {
      setDraggedVideoId(null);
      setDragOverVideoId(null);
      return;
    }

    const draggedIndex = videos.findIndex(v => v.id === draggedVideoId);
    const targetIndex = videos.findIndex(v => v.id === targetVideoId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedVideoId(null);
      setDragOverVideoId(null);
      return;
    }

    // Create new order array
    const newOrder = [...videos];
    const [draggedVideo] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedVideo);
    
    // Update sort_order for all videos
    const videoIds = newOrder.map(v => v.id);
    await saveVideoOrder(videoIds);
    
    setDraggedVideoId(null);
    setDragOverVideoId(null);
  }

  const handleDragEnd = () => {
    setDraggedVideoId(null);
    setDragOverVideoId(null);
  }

  const handleAddVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const fileInput = formData.get('file') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const vimeoId = formData.get('vimeo_id') as string
    const vimeoHash = formData.get('vimeo_hash') as string

    // Always try to parse URL - it handles both URLs and plain IDs
    let parsedId = vimeoId || ''
    let parsedHash = vimeoHash || ''
    if (vimeoId) {
      try {
        const parsed = parseVimeoUrl(vimeoId)
        if (parsed.videoId) {
          parsedId = parsed.videoId
          parsedHash = parsed.hash || vimeoHash || '' // Use parsed hash, or keep existing hash, or empty
        }
      } catch (err) {
        console.warn('Failed to parse Vimeo URL:', err)
        // Fall back to using vimeoId as-is
      }
    }

    // Validation: Need either file OR vimeo_id, and always need title
    if (!title) {
      alert('Please enter a title')
      return
    }

    if (!fileInput && !parsedId) {
      alert('Please either upload a video file OR enter a Vimeo ID')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadSpeed(null)
    setUploadLoaded(0)
    setUploadTotal(fileInput?.size || 0)
    uploadStartTimeRef.current = performance.now()

    // Create abort controller for cancellation
    const abortController = new AbortController()
    uploadAbortControllerRef.current = abortController

    try {
      let blobUrl: string | null = null
      let blobPath: string | null = null
      let fileName = 'vimeo-video'
      let fileSize: number | null = null

      // Step 1: Upload file to Blob ONLY if no Vimeo ID provided
      if (fileInput && !vimeoId) {
        console.log('📤 Starting client-side blob upload...')
        
        const blob = await upload(fileInput.name, fileInput, {
          access: 'public',
          handleUploadUrl: '/api/blob-upload',
          multipart: true, // Important for large files
          onUploadProgress: (progress) => {
            // Update progress from the blob upload
            const percentComplete = Math.min((progress.loaded / progress.total) * 100, 95)
            
            // Calculate MB/s
            if (uploadStartTimeRef.current !== null) {
              const elapsedSec = (performance.now() - uploadStartTimeRef.current) / 1000
              const mbUploaded = progress.loaded / (1024 * 1024)
              const mbPerSec = elapsedSec > 0 ? mbUploaded / elapsedSec : 0
              
              setUploadProgress(percentComplete)
              setUploadSpeed(mbPerSec)
              setUploadLoaded(progress.loaded)
              setUploadTotal(progress.total)
            }
          },
        })

        console.log('✅ Blob upload completed:', blob.url)
        blobUrl = blob.url
        blobPath = blob.pathname
        fileName = fileInput.name
        fileSize = fileInput.size
        setUploadProgress(95)
      } else if (parsedId || vimeoId) {
        // If using Vimeo, skip file upload
        console.log('📤 Using Vimeo video, skipping file upload...')
        setUploadProgress(50) // Show some progress
        fileName = `vimeo-${parsedId || vimeoId}`
      }

      // Step 2: Save video metadata to database
      const response = await fetch('/api/videos/create-from-blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl: blobUrl,
          blobPath: blobPath,
          title,
          description: description || null,
          category: category || null,
          file_name: fileName,
          file_size: fileSize,
          vimeo_id: parsedId || vimeoId || null,
          vimeo_hash: parsedHash || vimeoHash || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || error.details || 'Failed to save video')
      }

      setUploadProgress(100)
      setUploadSpeed(null) // Clear speed when complete
      
      // Reset form before closing modal (use ref for reliability)
      if (addVideoFormRef.current) {
        try {
          addVideoFormRef.current.reset()
        } catch (resetError) {
          console.warn('Could not reset form:', resetError)
        }
      }
      
      // Close modal and refresh video list
      setShowAddVideo(false)
      handleVideoChanged() // Refresh video list
      
      setTimeout(() => {
        setUploadProgress(0)
        setUploadSpeed(null)
        setUploadLoaded(0)
        setUploadTotal(0)
        uploadStartTimeRef.current = null
      }, 1000)
    } catch (error) {
      // Don't show alert if upload was cancelled
      if (error instanceof Error && (error.message === 'Upload cancelled' || error.name === 'AbortError')) {
        console.log('Upload cancelled by user')
      } else {
        console.error('Error adding video:', error)
        alert(`Failed to add video: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Don't close modal on error so user can retry
      }
    } finally {
      setUploading(false)
      uploadAbortControllerRef.current = null
      uploadStartTimeRef.current = null
    }
  }

  const handleCancelUpload = () => {
    // Cancel the upload using abort controller
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort()
      uploadAbortControllerRef.current = null
    }
    setUploading(false)
    setUploadProgress(0)
    setUploadSpeed(null)
    setUploadLoaded(0)
    setUploadTotal(0)
    uploadStartTimeRef.current = null
    setShowAddVideo(false)
    // Reset form
    if (addVideoFormRef.current) {
      try {
        addVideoFormRef.current.reset()
      } catch (resetError) {
        console.warn('Could not reset form:', resetError)
      }
    }
  }

  const handleVideoClick = async (video: Video) => {
    const videoUrl = video.video_url || video.blob_url
    
    console.log("Selected video:", video)
    console.log("Video URL for modal:", videoUrl)
    console.log("Video vimeo_id:", video.vimeo_id)
    
    
    // Pause any hover previews first
    videoRefs.current.forEach((videoEl) => {
      if (videoEl && !videoEl.paused) {
        try {
          videoEl.pause()
          videoEl.currentTime = 0
    } catch (error) {
          // Ignore pause errors
        }
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setSelectedVideo(video)
    setIsPlayerOpen(true)
  }

  const handleVideoLoad = (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => {
    // Video loaded successfully
  }

  const handleVideoError = (videoId: number, event: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error(`Video ${videoId} error:`, event.currentTarget.error)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)))

  // Show video grid directly (skip intro/menu logic)
  return (
    <div className="min-h-screen text-gray-100 relative bg-[#05060A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-red-900/60 bg-black/80 backdrop-blur-sm px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href="/"
              className="text-lg sm:text-xl font-bold text-gray-100 hover:opacity-70 transition-opacity touch-manipulation"
            >
              CIRCUS17
            </a>
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="/videos"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === null
                    ? "bg-red-600 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                All
              </a>
              <a
                href="/videos?category=music-video"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "music-video"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                MUSIC
              </a>
              <a
                href="/videos?category=industry-work"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "industry-work"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                LAUNCH VIDEOS
              </a>
              <a
                href="/videos?category=clothing"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "clothing"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                CLOTHING
              </a>
              <a
                href="/videos?category=live-events"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "live-events"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                LIVE EVENTS
              </a>
              <a
                href="/videos?category=bts"
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === "bts"
                    ? "bg-red-500 text-white"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                BTS
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <MobileNavMenu selectedCategory={selectedCategory} />
            
            {/* Contact button */}
            <a
              href="mailto:info@circusseventeen.com"
              className="hidden sm:inline-flex px-3 sm:px-4 py-2 text-xs sm:text-sm bg-transparent border border-white/30 hover:bg-red-500/90 hover:border-red-500/90 text-white rounded-full transition-colors touch-manipulation min-h-[44px] items-center justify-center"
            >
              Contact
            </a>
            {isAdmin && (
              <button
                onClick={() => setShowAddVideo(true)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full transition-all flex items-center gap-1.5 sm:gap-2 touch-manipulation min-h-[44px]"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Video</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Add Video Dialog */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Add New Video
              </h2>
              <button
                onClick={() => {
                  setShowAddVideo(false)
                  setUploadProgress(0)
                }}
                className="text-gray-400 hover:text-white"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={addVideoFormRef} onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Video File (optional if using Vimeo ID)
                </label>
                <input
                  type="file"
                  name="file"
                  accept="video/*"
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Upload a video file OR use Vimeo ID below (at least one required)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Enter video description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
                >
                  <option value="">None</option>
                  <option value="music-video">MUSIC</option>
                  <option value="industry-work">LAUNCH VIDEOS</option>
                  <option value="clothing">CLOTHING</option>
                  <option value="live-events">LIVE EVENTS</option>
                  <option value="bts">BTS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Vimeo ID (optional - use this instead of uploading a file)
                </label>
                <input
                  type="text"
                  name="vimeo_id"
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
                  placeholder="https://vimeo.com/123456789 or 123456789"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste full Vimeo URL (e.g., https://vimeo.com/123456789/ab8ee4cce4) or just the ID
                  <br />
                  <strong className="text-gray-300">If you provide a Vimeo ID, you don't need to upload a file.</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Vimeo Hash (for unlisted videos, optional)
                </label>
                <input
                  type="text"
                  name="vimeo_hash"
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-red-500"
                  placeholder="ab8ee4cce4"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Only needed for unlisted videos. Found after the ID in the URL (e.g., /123456789/<strong>ab8ee4cce4</strong>)
                </p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                    <span>Uploading... {uploadProgress.toFixed(1)}%</span>
                    {uploadSpeed !== null && (
                      <span className="font-mono">{uploadSpeed.toFixed(2)} MB/s</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadTotal > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {((uploadLoaded / (1024 * 1024))).toFixed(2)} MB / {((uploadTotal / (1024 * 1024))).toFixed(2)} MB
                      </span>
                      {uploadProgress < 95 && (
                        <span>Uploading to server...</span>
                      )}
                      {uploadProgress >= 95 && (
                        <span>Processing...</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm transition-colors"
                >
                  {uploading ? 'Cancel Upload' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Video
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">🎪</div>
              <p className="text-gray-400">Loading videos...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-xl text-gray-300 mb-2">No videos found</p>
              <p className="text-sm text-gray-400">
                {selectedCategory 
                  ? `No videos in "${selectedCategory}" category`
                  : "No videos available"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Main Video Area (YouTube-style - Larger) */}
            <div className="flex-1 lg:max-w-[65%] w-full">
              {featuredVideo && (
                <FeaturedVideoItem
                  video={featuredVideo}
                  onChanged={handleVideoChanged}
                  onVideoClick={() => handleVideoClick(featuredVideo)}
                  videoRefs={videoRefs}
                  onVideoLoad={handleVideoLoad}
                  onVideoError={handleVideoError}
                  formatDate={formatDate}
                  onReorder={isAdmin ? handleReorder : undefined}
                  canMoveUp={videos.findIndex(v => v.id === featuredVideo.id) > 0}
                  canMoveDown={videos.findIndex(v => v.id === featuredVideo.id) < videos.length - 1}
                  isDragging={draggedVideoId === featuredVideo.id}
                  isDragOver={dragOverVideoId === featuredVideo.id}
                  onDragStart={isAdmin ? handleDragStart : undefined}
                  onDragOver={isAdmin ? handleDragOver : undefined}
                  onDragLeave={isAdmin ? handleDragLeave : undefined}
                  onDrop={isAdmin ? handleDrop : undefined}
                  onDragEnd={isAdmin ? handleDragEnd : undefined}
                />
              )}
            </div>

            {/* Sidebar Videos (Right Side - YouTube-style sidebar) */}
            <div className="lg:w-[35%] lg:max-w-[450px] w-full space-y-2 sm:space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-2 sm:mb-3 hidden lg:block">Up Next</h3>
              {videos
                .filter((video) => video.id !== featuredVideo?.id)
                .map((video, index) => {
                  const actualIndex = videos.findIndex(v => v.id === video.id);
                  return (
                    <VideoItem
                      key={video.id}
                      video={video}
                      onChanged={handleVideoChanged}
                      onSelect={() => {
                        setFeaturedVideo(video)
                        handleVideoClick(video)
                      }}
                      videoRefs={videoRefs}
                      observerRef={observerRef}
                      onVideoLoad={handleVideoLoad}
                      onVideoError={handleVideoError}
                      formatDate={formatDate}
                      onReorder={isAdmin ? handleReorder : undefined}
                      canMoveUp={actualIndex > 0}
                      canMoveDown={actualIndex < videos.length - 1}
                      isDragging={draggedVideoId === video.id}
                      isDragOver={dragOverVideoId === video.id}
                      onDragStart={isAdmin ? handleDragStart : undefined}
                      onDragOver={isAdmin ? handleDragOver : undefined}
                      onDragLeave={isAdmin ? handleDragLeave : undefined}
                      onDrop={isAdmin ? handleDrop : undefined}
                      onDragEnd={isAdmin ? handleDragEnd : undefined}
                    />
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          title={selectedVideo.title}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false)
            setSelectedVideo(null)
          }}
          allVideos={videos}
          currentVideoIndex={videos.findIndex(v => v.id === selectedVideo.id)}
          onNextVideo={() => {
            const currentIndex = videos.findIndex(v => v.id === selectedVideo.id)
            if (currentIndex < videos.length - 1) {
              const nextVideo = videos[currentIndex + 1]
              setSelectedVideo(nextVideo)
            }
          }}
          onPrevVideo={() => {
            const currentIndex = videos.findIndex(v => v.id === selectedVideo.id)
            if (currentIndex > 0) {
              const prevVideo = videos[currentIndex - 1]
              setSelectedVideo(prevVideo)
            }
          }}
        />
      )}
    </div>
  )
}
