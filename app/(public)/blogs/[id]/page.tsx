"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, MessageSquare, Calendar, User, Trash2, AlertCircle, ArrowLeft } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

interface Comment {
  _id: string
  userName: string
  userEmail: string
  text: string
  createdAt: string
  userId: string
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
  createdAt: string
  updatedAt: string
  views: number
  comments: Comment[]
  authorName: string
  authorEmail: string
  status: string
}

export default function BlogDetailPage() {
  const params = useParams()
  const blogId = params.id as string

  const [blog, setBlog] = useState<Blog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState("")
  const [commentSuccess, setCommentSuccess] = useState("")

  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    fetchBlog()
  }, [blogId])

  const fetchBlog = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/blogs/${blogId}`)
      if (response.ok) {
        const data = await response.json()
        setBlog(data.blog)
      } else {
        setError("Blog not found")
      }
    } catch (err) {
      setError("Error loading blog")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCommentError("")
    setCommentSuccess("")

    if (!isAuthenticated) {
      setCommentError("Please login to comment")
      return
    }

    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty")
      return
    }

    setIsSubmittingComment(true)

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      })

      if (response.ok) {
        setCommentSuccess("Comment added successfully!")
        setCommentText("")
        fetchBlog()
        setTimeout(() => setCommentSuccess(""), 3000)
      } else {
        const data = await response.json()
        setCommentError(data.error || "Failed to add comment")
      }
    } catch (err) {
      setCommentError("Error adding comment")
      console.error(err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchBlog()
      }
    } catch (err) {
      console.error("Error deleting comment:", err)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading blog...</p>
        </div>
      </main>
    )
  }

  if (error || !blog) {
    return (
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link href="/blogs">
            <Button variant="outline" className="gap-2 mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Blogs
            </Button>
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold">{error || "Blog not found"}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const thumbnailImage = blog.images.find((img) => img.isThumbnail) || blog.images[0]

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/blogs">
          <Button variant="outline" className="gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Button>
        </Link>

        {/* Article Header */}
        <article className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {blog.authorName}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(blog.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {blog.views} views
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {blog.comments.length} comments
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {thumbnailImage && (
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src={thumbnailImage.url}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">
              {blog.content}
            </div>
          </div>

          {/* Image Gallery */}
          {blog.images.length > 1 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {blog.images.map((image, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {image.isThumbnail && (
                      <Badge className="absolute top-2 right-2">Featured</Badge>
                    )}
                    {image.caption && (
                      <p className="absolute bottom-2 left-2 right-2 text-xs bg-black/50 text-white p-1 rounded">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-12 pt-12 border-t">
            <h2 className="text-2xl font-bold mb-8">Comments</h2>

            {/* Add Comment Form */}
            {isAuthenticated ? (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <form onSubmit={handleAddComment} className="space-y-4">
                    {commentError && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {commentError}
                      </div>
                    )}

                    {commentSuccess && (
                      <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                        {commentSuccess}
                      </div>
                    )}

                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts about this blog..."
                      rows={4}
                    />

                    <Button type="submit" disabled={isSubmittingComment} className="gap-2">
                      {isSubmittingComment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">Please login to comment on this blog</p>
                  <Link href="/login">
                    <Button>Login</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {blog.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                blog.comments.map((comment) => (
                  <Card key={comment._id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{comment.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-muted-foreground">{comment.text}</p>
                        </div>

                        {isAuthenticated && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment._id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}