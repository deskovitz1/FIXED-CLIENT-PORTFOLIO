"use client"

import { useState, useEffect } from "react"
import { Video } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Trash2, Upload, Video as VideoIcon } from "lucide-react"

export default function AdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
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
    
    console.log("Form submitted", { 
      hasVideo: !!formData.video, 
      hasTitle: !!formData.title,
      videoName: formData.video?.name,
      title: formData.title 
    })
    
    if (!formData.video) {
      toast.error("Please select a video file")
      console.error("No video file selected")
      return
    }

    if (!formData.title) {
      toast.error("Please enter a title")
      console.error("No title entered")
      return
    }

    console.log("Starting upload...")
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

      console.log("Sending POST request to /api/videos")
      const response = await fetch("/api/videos", {
        method: "POST",
        body: uploadFormData,
      })

      console.log("Response status:", response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
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
        // Copy URL to clipboard
        navigator.clipboard.writeText(blobUrl).then(() => {
          toast.success(`Video uploaded! Blob URL copied to clipboard: ${blobUrl.substring(0, 50)}...`)
        }).catch(() => {
          toast.success(`Video uploaded! Blob URL: ${blobUrl}`)
        })
        console.log("Blob URL:", blobUrl)
      } else {
        toast.success("Video uploaded successfully")
      }
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        video: null,
      })
      
      // Reset file input
      const fileInput = document.getElementById("video") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
      
      fetchVideos()
    } catch (error) {
      console.error("Error uploading video:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload video")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this video?")) {
      return
    }

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      toast.success("Video deleted successfully")
      fetchVideos()
    } catch (error) {
      console.error("Error deleting video:", error)
      toast.error("Failed to delete video")
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

  return (
    <div className="min-h-screen bg-black text-white p-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-light mb-8">Video Admin</h1>

        {/* Upload Form */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Upload New Video</CardTitle>
            <CardDescription className="text-gray-400">
              Upload a 4K video to your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="video">Video File</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    console.log("File selected:", file?.name, file?.size)
                    if (file) {
                      setFormData((prev) => ({ ...prev, video: file }))
                    } else {
                      setFormData((prev) => ({ ...prev, video: null }))
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {formData.video && (
                  <p className="text-sm text-gray-400 mt-1">
                    Selected: {formData.video.name} ({formatFileSize(formData.video.size)})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log("Title changed:", value)
                    setFormData((prev) => ({ ...prev, title: value }))
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
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
                className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                onClick={(e) => {
                  console.log("Button clicked", {
                    uploading,
                    hasVideo: !!formData.video,
                    hasTitle: !!formData.title,
                    disabled: uploading || !formData.video || !formData.title
                  })
                }}
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </Button>
              {(!formData.video || !formData.title) && (
                <p className="text-xs text-gray-500 mt-2">
                  {!formData.video && "Please select a video file. "}
                  {!formData.title && "Please enter a title."}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Video List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Videos ({videos.length})</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your uploaded videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400">Loading videos...</p>
            ) : videos.length === 0 ? (
              <p className="text-gray-400">No videos uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <VideoIcon className="h-5 w-5 text-gray-400" />
                          <h3 className="font-medium text-white">{video.title}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {video.description && (
                        <p className="text-sm text-gray-400 mb-2">{video.description}</p>
                      )}
                      
                      {video.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded mb-2">
                          {video.category}
                        </span>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1 mt-2">
                        <p>File: {video.file_name}</p>
                        <p>Size: {formatFileSize(video.file_size)}</p>
                        <p>Uploaded: {formatDate(video.created_at)}</p>
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
  )
}

