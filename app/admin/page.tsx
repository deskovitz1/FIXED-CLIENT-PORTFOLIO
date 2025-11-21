"use client"

import { useState, useEffect } from "react"
import { Video } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Trash2, Upload, Video as VideoIcon, Play, Tag, Edit2, X, Check, Sparkles, Film } from "lucide-react"

const CIRCUS_COLORS = {
  red: "#FF1744",
  yellow: "#FFD600",
  blue: "#00B0FF",
  purple: "#9C27B0",
  orange: "#FF6F00",
  pink: "#E91E63",
}

const CATEGORY_COLORS: Record<string, string> = {
  "recent-work": CIRCUS_COLORS.blue,
  "industry-work": CIRCUS_COLORS.purple,
  "music-video": CIRCUS_COLORS.pink,
  "narrative": CIRCUS_COLORS.orange,
}

export default function AdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    video: null as File | null,
  })

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos")
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast.error("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.video) {
      toast.error("Please select a video file")
      return
    }

    if (!formData.title) {
      toast.error("Please enter a title")
      return
    }

    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("video", formData.video)
      uploadFormData.append("title", formData.title)
      if (formData.description) {
        uploadFormData.append("description", formData.description)
      }
      if (formData.category) {
        uploadFormData.append("category", formData.category)
      }

      const response = await fetch("/api/videos", {
        method: "POST",
        body: uploadFormData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: errorText || `Upload failed with status ${response.status}` }
        }
        throw new Error(error.error || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      const blobUrl = result.video?.blob_url || result.video?.video_url
      
      if (blobUrl) {
        navigator.clipboard.writeText(blobUrl).then(() => {
          toast.success(`🎪 Video uploaded! Blob URL copied to clipboard!`)
        }).catch(() => {
          toast.success(`🎪 Video uploaded successfully!`)
        })
      } else {
        toast.success("🎪 Video uploaded successfully!")
      }
      
      setFormData({
        title: "",
        description: "",
        category: "",
        video: null,
      })
      
      const fileInput = document.getElementById("video") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
      
      setTimeout(async () => {
        await fetchVideos()
      }, 500)
    } catch (error) {
      console.error("Error uploading video:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload video")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return

    try {
      const response = await fetch(`/api/videos/${videoToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      toast.success("🎪 Video deleted successfully!")
      setDeleteDialogOpen(false)
      setVideoToDelete(null)
      fetchVideos()
    } catch (error) {
      console.error("Error deleting video:", error)
      toast.error("Failed to delete video")
    }
  }

  const handleCategoryChange = async (videoId: number, newCategory: string) => {
    try {
      // TODO: Add API endpoint for updating video category
      toast.success("Category updated! (Feature coming soon)")
      fetchVideos()
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredVideos = selectedCategory === "all" 
    ? videos 
    : videos.filter(v => v.category === selectedCategory)

  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)))

  return (
    <div className="min-h-screen relative z-10 overflow-hidden">
      {/* Circus Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 opacity-90"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255, 255, 255, 0.05) 10px,
          rgba(255, 255, 255, 0.05) 20px
        )`
      }}></div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-10 w-10 text-yellow-400 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-400 bg-clip-text text-transparent">
                🎪 Video Circus 🎪
              </h1>
              <Sparkles className="h-10 w-10 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-xl text-white/80">Manage your video collection with style!</p>
          </div>

          {/* Upload Form - Circus Tent Style */}
          <Card className="mb-8 border-4 border-yellow-400 shadow-2xl bg-gradient-to-br from-red-500 via-pink-500 to-purple-500">
            <CardHeader className="bg-white/10 backdrop-blur-sm">
              <CardTitle className="text-3xl text-white flex items-center gap-2">
                <Film className="h-8 w-8" />
                Upload New Video
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Add a new act to your circus! 🎬
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white/95 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="video" className="text-gray-700 font-semibold">Video File 🎥</Label>
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData((prev) => ({ ...prev, video: file }))
                        } else {
                          setFormData((prev) => ({ ...prev, video: null }))
                        }
                      }}
                      className="bg-white border-2 border-gray-300 hover:border-yellow-400 transition-colors"
                    />
                    {formData.video && (
                      <p className="text-sm text-green-600 mt-1 font-medium">
                        ✓ Selected: {formData.video.name} ({formatFileSize(formData.video.size)})
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-gray-700 font-semibold">Title * 🎭</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="bg-white border-2 border-gray-300 hover:border-yellow-400 transition-colors"
                      placeholder="Enter video title..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-700 font-semibold">Description 📝</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="bg-white border-2 border-gray-300 hover:border-yellow-400 transition-colors"
                    rows={3}
                    placeholder="Tell us about this video..."
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-gray-700 font-semibold">Category 🏷️</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-yellow-400 transition-colors">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent-work">Recent Work</SelectItem>
                      <SelectItem value="industry-work">Industry Work</SelectItem>
                      <SelectItem value="music-video">Music Video</SelectItem>
                      <SelectItem value="narrative">Narrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={uploading || !formData.video || !formData.title}
                  className="w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 hover:from-yellow-500 hover:via-pink-600 hover:to-purple-600 text-white font-bold text-lg py-6 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-5 w-5 animate-spin" />
                      Uploading to the circus...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      🎪 Upload to Circus! 🎪
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Video List - Circus Cards */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={`${selectedCategory === "all" ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-white/20 text-white hover:bg-white/30"} border-2`}
            >
              All Videos ({videos.length})
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat || "")}
                className={`${selectedCategory === cat ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-white/20 text-white hover:bg-white/30"} border-2`}
              >
                {cat}
              </Button>
            ))}
          </div>

          <Card className="border-4 border-blue-400 shadow-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <CardHeader className="bg-white/10 backdrop-blur-sm">
              <CardTitle className="text-3xl text-white flex items-center gap-2">
                <VideoIcon className="h-8 w-8" />
                Your Video Collection ({filteredVideos.length})
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Manage and organize your videos 🎬
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white/95 p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin text-6xl">🎪</div>
                  <p className="text-gray-600 mt-4 text-lg">Loading your circus...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎭</div>
                  <p className="text-gray-600 text-lg">No videos in this category yet!</p>
                  <p className="text-gray-500">Upload your first video to get started 🎬</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <Card 
                      key={video.id} 
                      className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-yellow-400 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <CardContent className="p-5">
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
                          <div className="absolute top-2 right-2">
                            {video.category && (
                              <Badge 
                                className="text-xs font-bold"
                                style={{ 
                                  backgroundColor: CATEGORY_COLORS[video.category] || CIRCUS_COLORS.blue,
                                  color: "white"
                                }}
                              >
                                {video.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Video Info */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{video.title}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(video)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {video.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {video.category || "Uncategorized"}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                            <p className="flex items-center gap-1">
                              <span className="font-semibold">File:</span> {video.file_name}
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="font-semibold">Size:</span> {formatFileSize(video.file_size)}
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="font-semibold">Uploaded:</span> {formatDate(video.created_at)}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3 border-2 hover:bg-yellow-400 hover:border-yellow-500 hover:text-black"
                            onClick={() => window.open(video.blob_url, "_blank")}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch Video
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-4 border-red-500">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
              <Trash2 className="h-6 w-6" />
              Delete Video?
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-lg">
              Are you sure you want to delete <strong>"{videoToDelete?.title}"</strong>? 
              <br />
              This action cannot be undone! 🎭
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setVideoToDelete(null)
              }}
              className="border-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
