"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Loader2, Trash2, Edit2, Image as ImageIcon, Eye, MessageSquare, Heart, MessageCircle, X } from "lucide-react"
import { TiptapEditor } from "@/components/tiptap-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Reply {
  _id: string
  userName: string
  userEmail: string
  text: string
  createdAt: string
  userId: string
  likes?: string[]
}

interface Comment {
  _id: string
  userName: string
  userEmail: string
  text: string
  createdAt: string
  userId: string
  likes?: string[]
  replies?: Reply[]
}

interface BlogImage {
  url: string
  isThumbnail: boolean
  caption: string
}

interface Blog {
  _id: string
  title: string
  content: string
  images: BlogImage[]
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
  views: number
  comments: Comment[]
  authorName: string
}

export function AdminBlogManager() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft" as "draft" | "published",
  })
  const [uploadedImages, setUploadedImages] = useState<BlogImage[]>([])
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0)
  const [adminToken, setAdminToken] = useState<string>("")
  const [showCommentsDialog, setShowCommentsDialog] = useState(false)
  const [selectedBlogForComments, setSelectedBlogForComments] = useState<Blog | null>(null)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (token) {
      setAdminToken(token)
      fetchBlogs()
    }
  }, [])

  const fetchBlogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/blogs", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBlogs(data.blogs || [])
      } else {
        setError("Failed to fetch blogs")
      }
    } catch (err) {
      setError("Error fetching blogs")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload valid image files")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        const newImage: BlogImage = {
          url: base64String,
          isThumbnail: uploadedImages.length === 0 && thumbnailIndex === uploadedImages.length,
          caption: "",
        }
        setUploadedImages([...uploadedImages, newImage])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ""
  }

  const setThumbnail = (index: number) => {
    const updatedImages = uploadedImages.map((img, idx) => ({
      ...img,
      isThumbnail: idx === index,
    }))
    setUploadedImages(updatedImages)
    setThumbnailIndex(index)
  }

  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, idx) => idx !== index)
    if (thumbnailIndex === index && updatedImages.length > 0) {
      updatedImages[0].isThumbnail = true
      setThumbnailIndex(0)
    }
    setUploadedImages(updatedImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.title || !formData.content) {
      setError("Title and content are required")
      return
    }

    if (uploadedImages.length === 0) {
      setError("At least one image is required")
      return
    }

    if (!uploadedImages.some((img) => img.isThumbnail)) {
      setError("Please select a thumbnail image")
      return
    }

    setIsLoading(true)

    try {
      const url = editingBlog ? `/api/blogs/${editingBlog._id}` : "/api/blogs"
      const method = editingBlog ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          status: formData.status,
          images: uploadedImages,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingBlog ? "Blog updated successfully!" : "Blog created successfully!")
        setShowDialog(false)
        resetForm()
        fetchBlogs()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to save blog")
      }
    } catch (err) {
      setError("Error saving blog")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title,
      content: blog.content,
      status: blog.status,
    })
    setUploadedImages(blog.images)
    const thumbIndex = blog.images.findIndex((img) => img.isThumbnail)
    setThumbnailIndex(thumbIndex >= 0 ? thumbIndex : 0)
    setShowDialog(true)
  }

  const handleDelete = async (blogId: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        setSuccess("Blog deleted successfully!")
        fetchBlogs()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete blog")
      }
    } catch (err) {
      setError("Error deleting blog")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: "", content: "", status: "draft" })
    setUploadedImages([])
    setThumbnailIndex(0)
    setEditingBlog(null)
  }

  const handleOpenDialog = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleViewComments = (blog: Blog) => {
    setSelectedBlogForComments(blog)
    setShowCommentsDialog(true)
    setReplyingToCommentId(null)
    setReplyText("")
    setLikedComments(new Set())
    setLikedReplies(new Set())
  }

  const handleAdminLikeComment = async (commentId: string) => {
    if (!selectedBlogForComments) return

    try {
      const response = await fetch(`/api/blogs/${selectedBlogForComments._id}/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const isLiked = likedComments.has(commentId)
        if (isLiked) {
          likedComments.delete(commentId)
        } else {
          likedComments.add(commentId)
        }
        setLikedComments(new Set(likedComments))
        await fetchBlogs()
      }
    } catch (err) {
      console.error("Error liking comment:", err)
    }
  }

  const handleAdminAddReply = async (commentId: string) => {
    if (!selectedBlogForComments || !replyText.trim()) return

    setIsSubmittingReply(true)

    try {
      const response = await fetch(
        `/api/blogs/${selectedBlogForComments._id}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ text: replyText }),
        }
      )

      if (response.ok) {
        setReplyText("")
        setReplyingToCommentId(null)
        await fetchBlogs()
        // Refresh the selected blog for comments display
        const updatedBlog = blogs.find((b) => b._id === selectedBlogForComments._id)
        if (updatedBlog) {
          setSelectedBlogForComments(updatedBlog)
        }
      } else {
        setError("Failed to add reply")
      }
    } catch (err) {
      console.error("Error adding reply:", err)
      setError("Error adding reply")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleAdminDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm("Delete this reply?") || !selectedBlogForComments) return

    try {
      const response = await fetch(
        `/api/blogs/${selectedBlogForComments._id}/comments/${commentId}/replies/${replyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )

      if (response.ok) {
        await fetchBlogs()
        const updatedBlog = blogs.find((b) => b._id === selectedBlogForComments._id)
        if (updatedBlog) {
          setSelectedBlogForComments(updatedBlog)
        }
      }
    } catch (err) {
      console.error("Error deleting reply:", err)
    }
  }

  const handleAdminLikeReply = async (commentId: string, replyId: string) => {
    if (!selectedBlogForComments) return

    try {
      const response = await fetch(
        `/api/blogs/${selectedBlogForComments._id}/comments/${commentId}/replies/${replyId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )

      if (response.ok) {
        const likeId = `${commentId}-${replyId}`
        const isLiked = likedReplies.has(likeId)
        if (isLiked) {
          likedReplies.delete(likeId)
        } else {
          likedReplies.add(likeId)
        }
        setLikedReplies(new Set(likedReplies))
        await fetchBlogs()
      }
    } catch (err) {
      console.error("Error liking reply:", err)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg">
          {success}
        </div>
      )}

      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4">
        <div>
          <h2 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold">Blog Management</h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Create, edit, and manage blog posts</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2 w-full xs:w-auto h-9 sm:h-10">
          <ImageIcon className="w-4 h-4" />
          <span className="hidden xs:inline">Create New Blog</span>
          <span className="xs:hidden">New Blog</span>
        </Button>
      </div>

      {/* Create/Edit Blog Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg">{editingBlog ? "Edit Blog" : "Create New Blog"}</DialogTitle>
            <DialogDescription className="text-sm">
              {editingBlog ? "Update blog details and images" : "Add a new blog post with images and content"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-1">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Blog Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog title"
                  className="h-9 sm:h-10"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content *</label>
                <div className="min-h-[200px] sm:min-h-[250px]">
                  <TiptapEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Start typing your blog content..."
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" })}
                  className="w-full px-3 py-2 border rounded-md h-9 sm:h-10 text-sm"
                >
                  <option value="draft">Draft (Only visible to admins)</option>
                  <option value="published">Published (Visible to all users)</option>
                </select>
              </div>

              {/* Image Upload */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Images * (Max 6 images)</label>
                  <p className="text-xs text-muted-foreground">
                    Upload 5-6 images. One image will be set as thumbnail.
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadedImages.length >= 6}
                    className="cursor-pointer h-9 sm:h-10 text-sm"
                  />
                </div>

                {/* Image Gallery */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Uploaded Images ({uploadedImages.length})</p>
                    <div className="border rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                        {uploadedImages.map((image, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={image.url}
                              alt={`Uploaded ${idx + 1}`}
                              className={`w-full aspect-square object-cover rounded-lg border-2 ${
                                image.isThumbnail ? "border-primary" : "border-border"
                              }`}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center p-1 gap-1">
                              {!image.isThumbnail && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setThumbnail(idx)}
                                  className="text-xs h-6 px-2 w-full"
                                >
                                  Set Thumb
                                </Button>
                              )}
                              {image.isThumbnail && (
                                <Badge className="text-xs px-1 py-0 h-5">Thumbnail</Badge>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(idx)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </ScrollArea>

          {/* Form Actions */}
          <div className="flex-shrink-0 flex gap-2 sm:gap-3 justify-end pt-3 sm:pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={handleSubmit}
              className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingBlog ? "Update Blog" : "Create Blog"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg truncate">Blog Comments - {selectedBlogForComments?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedBlogForComments?.comments?.length || 0} comment(s)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 border rounded-lg p-3 sm:p-4 space-y-4">
            {!selectedBlogForComments?.comments || selectedBlogForComments.comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No comments yet</p>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {selectedBlogForComments.comments.map((comment) => (
                  <div key={comment._id} className="space-y-3 border-b pb-4">
                    {/* Main Comment */}
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-lg">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{comment.userName}</p>
                            <p className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap mt-1 break-words">{comment.text}</p>

                          {/* Comment Actions */}
                          <div className="flex gap-1 sm:gap-2 pt-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAdminLikeComment(comment._id)}
                              className="gap-1 h-6 text-xs px-2"
                            >
                              <Heart
                                className={`w-3 h-3 ${
                                  likedComments.has(comment._id) ? "fill-red-500 text-red-500" : ""
                                }`}
                              />
                              <span>{comment.likes?.length || 0}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReplyingToCommentId(comment._id)}
                              className="gap-1 h-6 text-xs px-2"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span className="hidden xs:inline">Reply</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reply Form */}
                    {replyingToCommentId === comment._id && (
                      <div className="ml-2 sm:ml-4 border-l-2 border-l-accent bg-accent/5 p-2 sm:p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-medium truncate">Reply to {comment.userName}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingToCommentId(null)}
                            className="h-5 w-5 p-0 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleAdminAddReply(comment._id)
                          }}
                          className="space-y-2"
                        >
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            className="resize-none text-xs sm:text-sm"
                          />
                          <Button
                            type="submit"
                            disabled={isSubmittingReply}
                            size="sm"
                            className="gap-1 text-xs h-7"
                          >
                            {isSubmittingReply ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-3 h-3" />
                                Reply
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-2 sm:ml-4 space-y-2 border-l-2 border-l-muted pl-2 sm:pl-3">
                        {comment.replies.map((reply) => (
                          <div key={reply._id} className="bg-muted/20 p-2 rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-xs truncate">{reply.userName}</p>
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-xs text-foreground whitespace-pre-wrap break-words">{reply.text}</p>

                              {/* Reply Action Buttons */}
                              <div className="flex gap-1 sm:gap-2 pt-1 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAdminLikeReply(comment._id, reply._id)}
                                  className="gap-1 h-5 text-xs px-1"
                                >
                                  <Heart
                                    className={`w-2 h-2 ${
                                      likedReplies.has(`${comment._id}-${reply._id}`)
                                        ? "fill-red-500 text-red-500"
                                        : ""
                                    }`}
                                  />
                                  <span className="text-xs">{reply.likes?.length || 0}</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAdminDeleteReply(comment._id, reply._id)}
                                  className="gap-1 h-5 text-xs px-1 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-2 h-2" />
                                  <span className="hidden xs:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Blogs List */}
      <div className="grid gap-3 sm:gap-4">
        {isLoading && blogs.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm sm:text-base">Loading blogs...</p>
            </CardContent>
          </Card>
        ) : blogs.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
              <p className="text-sm sm:text-base">No blogs yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          blogs.map((blog) => (
            <Card key={blog._id} className="overflow-hidden hover:border-primary/50 transition">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                {/* Thumbnail */}
                {blog.images.find((img) => img.isThumbnail) && (
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <img
                      src={blog.images.find((img) => img.isThumbnail)?.url}
                      alt={blog.title}
                      className="w-full h-48 sm:w-24 sm:h-24 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="space-y-2">
                    <h3 className="font-heading font-semibold text-base sm:text-lg line-clamp-2">{blog.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">{blog.content}</p>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={blog.status === "published" ? "default" : "secondary"} className="text-xs">
                        {blog.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Eye className="w-3 h-3" />
                        {blog.views}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <MessageSquare className="w-3 h-3" />
                        {blog.comments?.length || 0}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-2">
                    {blog.comments && blog.comments.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewComments(blog)}
                        className="gap-2 h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm justify-center xs:justify-start"
                        title={`View ${blog.comments.length} comments`}
                      >
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Comments ({blog.comments.length})</span>
                        <span className="xs:hidden">Comments</span>
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(blog)}
                        className="gap-2 h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm flex-1 xs:flex-none"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(blog._id)}
                        className="gap-2 h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm flex-1 xs:flex-none"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    By {blog.authorName} • {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}