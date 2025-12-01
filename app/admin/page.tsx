"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Edit2, Trash2, Eye, EyeOff, Play, Search, Filter } from "lucide-react"

interface Video {
  id: number
  title: string
  description: string | null
  category: string | null
  video_url: string
  blob_url: string
  file_name: string
  display_date: string | null
  created_at: string
  is_visible?: boolean
}

export default function AdminPage() {
  const isMobile = useIsMobile()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    display_date: "",
    is_visible: true,
  })

  // Fetch videos from API (excludes hidden videos)
  const fetchVideos = async () => {
    try {
      setLoading(true)
      // Remove includeIntro=true to filter out hidden videos (is_visible=false)
      const response = await fetch("/api/videos")
      if (!response.ok) {
        throw new Error("Failed to fetch videos")
      }
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast.error("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  // Handle edit click
  const handleEditClick = (video: Video) => {
    setEditingVideo(video)
    setEditFormData({
      title: video.title,
      description: video.description || "",
      category: video.category || "",
      display_date: video.display_date ? video.display_date.split("T")[0] : "",
      is_visible: video.is_visible !== false,
    })
    setEditDialogOpen(true)
  }

  // Handle save edit
  const handleEditSave = async () => {
    if (!editingVideo) return

    if (!editFormData.title.trim()) {
      toast.error("Title is required")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/videos/${editingVideo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description || null,
          category: editFormData.category || null,
          display_date: editFormData.display_date || null,
          is_visible: editFormData.is_visible,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update video")
      }

      toast.success("Video updated successfully!")
      setEditDialogOpen(false)
      setEditingVideo(null)
      await fetchVideos()
    } catch (error) {
      console.error("Error updating video:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update video")
    } finally {
      setSaving(false)
    }
  }

  // Handle delete click
  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video)
    setDeleteDialogOpen(true)
  }

  // Handle hide confirm - sets is_visible=false to hide from website
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return

    try {
      // Only send fields that exist - let the API handle missing columns gracefully
      const updatePayload: any = {
        title: videoToDelete.title,
        description: videoToDelete.description,
        category: videoToDelete.category,
        is_visible: false, // Hide from website
      };
      
      // Only include display_date if it exists
      if (videoToDelete.display_date) {
        updatePayload.display_date = videoToDelete.display_date;
      }

      const response = await fetch(`/api/videos/${videoToDelete.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        let errorMessage = "Failed to hide video"
        let errorDetails = ""
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData.details || errorData.errorType || ""
          console.error("Hide video error response:", errorData)
        } catch {
          errorMessage = `Failed to hide video with status ${response.status}`
        }
        const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage
        throw new Error(fullError)
      }

      toast.success("Video hidden from website successfully!")
      setDeleteDialogOpen(false)
      setVideoToDelete(null)
      await fetchVideos()
    } catch (error) {
      console.error("Error hiding video:", error)
      toast.error(error instanceof Error ? error.message : "Failed to hide video")
    }
  }

  // Toggle visibility
  const handleToggleVisibility = async (video: Video) => {
    try {
      const newVisibility = video.is_visible === false ? true : false
      
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          category: video.category,
          display_date: video.display_date,
          is_visible: newVisibility,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to update visibility"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          console.error("Toggle visibility error:", errorData)
        } catch {
          errorMessage = `Failed with status ${response.status}`
        }
        throw new Error(errorMessage)
      }

      toast.success(`Video ${newVisibility ? "shown" : "hidden"} on website`)
      await fetchVideos()
    } catch (error) {
      console.error("Error toggling visibility:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update visibility")
      throw error // Re-throw so handleHideConfirm can catch it
    }
  }

  // Filter videos
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(videos.map((v) => v.category).filter((cat): cat is string => Boolean(cat))))

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Video Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your video collection - edit details, categorize, and control visibility
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search videos by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-12 text-center">
              <p className="text-gray-600">
                {searchQuery || selectedCategory !== "all"
                  ? "No videos match your search"
                  : "No videos found. Upload videos to Vercel Blob Storage and they will appear here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className={`bg-white border transition-all ${
                  video.is_visible === false
                    ? "border-gray-300 opacity-75"
                    : "border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                }`}
              >
                <CardContent className="p-3 sm:p-4 md:p-5">
                  {/* Video Preview */}
                  <div className="relative mb-4 bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      src={video.blob_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-80" />
                    </div>
                    {video.is_visible === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <EyeOff className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {video.category && (
                      <div className="absolute top-2 right-2">
                        <Badge className="text-xs font-medium bg-red-600 text-white">
                          {video.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">
                        {video.title}
                      </h3>
                      <div className="flex gap-1 sm:gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(video)}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 min-h-[44px] min-w-[44px] p-2"
                          title={video.is_visible === false ? "Show on website" : "Hide from website"}
                        >
                          {video.is_visible === false ? (
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(video)}
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px] p-2"
                          title="Edit video"
                        >
                          <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(video)}
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px] p-2"
                          title="Delete video from database"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </div>
                    </div>

                    {video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {video.description}
                      </p>
                    )}

                    {video.display_date && (
                      <p className="text-xs text-gray-500">
                        Date: {new Date(video.display_date).toLocaleDateString()}
                      </p>
                    )}

                    <p className="text-xs text-gray-400">
                      {video.file_name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-white border border-gray-200 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-red-600" />
                Edit Video
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Update video details and visibility
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title" className="text-gray-700 font-medium mb-1.5 block">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500 transition-colors"
                  placeholder="Enter a descriptive title..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description" className="text-gray-700 font-medium mb-1.5 block">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500 transition-colors"
                  rows={4}
                  placeholder="Enter a description for this video..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category" className="text-gray-700 font-medium mb-1.5 block">
                    Category
                  </Label>
                  <Select
                    value={editFormData.category || ""}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({ ...prev, category: value === "" ? "" : value }))
                    }
                  >
                    <SelectTrigger className="bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (No Category)</SelectItem>
                      <SelectItem value="recent-work">Recent Work</SelectItem>
                      <SelectItem value="music-video">Music</SelectItem>
                      <SelectItem value="industry-work">Launch Videos</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="narrative">Narrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-display_date" className="text-gray-700 font-medium mb-1.5 block">
                    Display Date
                  </Label>
                  <Input
                    id="edit-display_date"
                    type="date"
                    value={editFormData.display_date}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, display_date: e.target.value }))
                    }
                    className="bg-white border border-gray-300 hover:border-gray-400 focus:border-red-500 focus:ring-red-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Controls order in "Recent Work" category
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-is_visible"
                  checked={editFormData.is_visible}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, is_visible: e.target.checked }))
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <Label htmlFor="edit-is_visible" className="text-gray-700 font-medium">
                  Show this video on the website
                </Label>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setEditingVideo(null)
                }}
                className="border border-gray-300 hover:bg-gray-50 w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={saving || !editFormData.title.trim()}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto min-h-[44px]"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hide from Website Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-red-600" />
                Hide Video from Website?
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Hide <strong>"{videoToDelete?.title}"</strong> from your website?
                <br />
                <span className="text-sm text-gray-500">
                  The video will remain in your database and blob storage, but will be hidden from all website pages (admin and public).
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setVideoToDelete(null)
                }}
                className="border border-gray-300 hover:bg-gray-50 w-full sm:w-auto min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto min-h-[44px]"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide from Website
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
