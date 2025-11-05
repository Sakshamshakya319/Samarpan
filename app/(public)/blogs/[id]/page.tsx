"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, MessageSquare, Calendar, User, Trash2, AlertCircle, ArrowLeft, Heart, MessageCircle, X, Share2, Mail, Facebook, Instagram } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

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
  const [userToken, setUserToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set())

  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

  // Initialize token and userId from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    
    if (storedToken) {
      setUserToken(storedToken)
    } else if (token) {
      setUserToken(token)
    }
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserId(user._id || user.id)
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e)
      }
    }
  }, [token])

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

    if (!isAuthenticated || !userToken) {
      setCommentError("Please login to comment")
      console.warn("[Blog Comments] User not authenticated or token missing")
      return
    }

    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty")
      return
    }

    if (!userToken) {
      setCommentError("Authentication token not found. Please refresh and try again.")
      console.error("[Blog Comments] Token is missing when attempting to post comment")
      return
    }

    setIsSubmittingComment(true)

    try {
      console.log("[Blog Comments] Posting comment with token", userToken.substring(0, 20) + "...")
      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ text: commentText }),
      })

      console.log("[Blog Comments] Comment POST response status:", response.status)

      if (response.ok) {
        setCommentSuccess("Comment added successfully!")
        setCommentText("")
        await fetchBlog()
        setTimeout(() => setCommentSuccess(""), 3000)
      } else {
        const data = await response.json()
        console.error("[Blog Comments] Comment POST error:", data)
        setCommentError(data.error || "Failed to add comment")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.error("[Blog Comments] Exception while posting comment:", errorMsg)
      setCommentError("Error adding comment. Please try again.")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return

    if (!userToken) {
      console.error("[Blog Comments] Token missing for delete operation")
      return
    }

    try {
      console.log("[Blog Comments] Deleting comment with token", userToken.substring(0, 20) + "...")
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      console.log("[Blog Comments] Comment DELETE response status:", response.status)

      if (response.ok) {
        await fetchBlog()
      } else {
        const data = await response.json()
        console.error("[Blog Comments] Delete comment error:", data)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.error("[Blog Comments] Exception while deleting comment:", errorMsg)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated || !userToken || !userId) {
      setCommentError("Please login to like comments")
      return
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
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
        await fetchBlog()
      } else {
        const data = await response.json()
        console.error("[Blog Comments] Like error:", data)
      }
    } catch (err) {
      console.error("[Blog Comments] Exception while liking comment:", err)
    }
  }

  const handleAddReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault()
    
    if (!isAuthenticated || !userToken) {
      setCommentError("Please login to reply")
      return
    }

    if (!replyText.trim()) {
      setCommentError("Reply cannot be empty")
      return
    }

    setIsSubmittingReply(true)

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ text: replyText }),
      })

      if (response.ok) {
        setReplyText("")
        setReplyingToCommentId(null)
        await fetchBlog()
      } else {
        const data = await response.json()
        console.error("[Blog Comments] Reply error:", data)
        setCommentError(data.error || "Failed to add reply")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.error("[Blog Comments] Exception while posting reply:", errorMsg)
      setCommentError("Error adding reply. Please try again.")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm("Delete this reply?")) return

    if (!userToken) {
      console.error("[Blog Comments] Token missing for delete reply operation")
      return
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}/replies/${replyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      if (response.ok) {
        await fetchBlog()
      } else {
        const data = await response.json()
        console.error("[Blog Comments] Delete reply error:", data)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.error("[Blog Comments] Exception while deleting reply:", errorMsg)
    }
  }

  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!isAuthenticated || !userToken || !userId) {
      setCommentError("Please login to like replies")
      return
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}/replies/${replyId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      })

      if (response.ok) {
        const likeId = `${commentId}-${replyId}`
        const isLiked = likedReplies.has(likeId)
        if (isLiked) {
          likedReplies.delete(likeId)
        } else {
          likedReplies.add(likeId)
        }
        setLikedReplies(new Set(likedReplies))
        await fetchBlog()
      } else {
        const data = await response.json()
        console.error("[Blog Comments] Reply like error:", data)
      }
    } catch (err) {
      console.error("[Blog Comments] Exception while liking reply:", err)
    }
  }

  const handleShareBlog = (platform: string) => {
    const blogUrl = typeof window !== "undefined" ? window.location.href : ""
    const title = blog?.title || "Check out this blog"
    const text = `${title} - Read on Samarpan`

    const shares = {
      facebook: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`, "_blank", "width=600,height=400")
      },
      whatsapp: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + blogUrl)}`, "_blank")
      },
      twitter: () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(title)}`, "_blank", "width=600,height=400")
      },
      mail: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + blogUrl)}`
      },
      instagram: () => {
        alert("To share on Instagram, copy the link and paste it in your Instagram story or direct message.")
        navigator.clipboard.writeText(blogUrl)
      },
      copy: () => {
        navigator.clipboard.writeText(blogUrl).then(() => {
          alert("Link copied to clipboard!")
        })
      },
    }

    const shareFunc = shares[platform as keyof typeof shares]
    if (shareFunc) {
      shareFunc()
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

            {/* Social Sharing */}
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
              <span className="text-sm font-medium text-muted-foreground">Share:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareBlog("facebook")}
                className="gap-2"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareBlog("whatsapp")}
                className="gap-2"
                title="Share on WhatsApp"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.73 1.16l-.335.198-3.476.523.529 3.372.38.183c.247.123.486.271.707.445 3.282 2.817 8.125 2.51 11.044-.566 1.231-1.268 2.077-3.016 2.288-4.853.055-.468.034-.933-.017-1.395 0-.036 0-.073-.003-.109-.15-.864-.787-1.618-1.675-1.822-.34-.066-.686-.053-1.024.044-1.297.349-2.572 1.336-3.226 2.565-.224.433-.427.923-.586 1.457-.04.134-.082.269-.124.402z"/>
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareBlog("twitter")}
                className="gap-2"
                title="Share on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7-2.25 1.5-2.25 1.5-4.5-.25"/>
                </svg>
                <span className="hidden sm:inline">Twitter</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareBlog("instagram")}
                className="gap-2"
                title="Share on Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareBlog("mail")}
                className="gap-2"
                title="Share via Email"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareBlog("copy")}
                className="gap-2"
                title="Copy link"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Copy Link</span>
              </Button>
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
            <div className="space-y-6">
              {blog.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                blog.comments.map((comment) => (
                  <div key={comment._id} className="space-y-4">
                    {/* Main Comment */}
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{comment.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">{comment.text}</p>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleLikeComment(comment._id)}
                                className="gap-1 h-7 text-xs"
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    likedComments.has(comment._id) ? "fill-red-500 text-red-500" : ""
                                  }`}
                                />
                                <span>{comment.likes?.length || 0}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReplyingToCommentId(comment._id)}
                                className="gap-1 h-7 text-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Reply
                              </Button>

                              {isAuthenticated && userId === comment.userId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="gap-1 h-7 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Reply Form */}
                    {replyingToCommentId === comment._id && (
                      <Card className="ml-6 border-l-2 border-l-accent bg-accent/5">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-medium">Reply to {comment.userName}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReplyingToCommentId(null)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <form onSubmit={(e) => handleAddReply(e, comment._id)} className="space-y-2">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              rows={2}
                              className="resize-none"
                            />
                            <Button
                              type="submit"
                              disabled={isSubmittingReply}
                              size="sm"
                              className="gap-1"
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
                        </CardContent>
                      </Card>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-6 space-y-3 border-l-2 border-l-muted pl-4">
                        {comment.replies.map((reply) => (
                          <Card key={reply._id} className="bg-muted/30">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{reply.userName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {reply.text}
                                </p>

                                {/* Reply Action Buttons */}
                                <div className="flex gap-3 pt-1 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleLikeReply(comment._id, reply._id)}
                                    className="gap-1 h-6 text-xs px-2"
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${
                                        likedReplies.has(`${comment._id}-${reply._id}`)
                                          ? "fill-red-500 text-red-500"
                                          : ""
                                      }`}
                                    />
                                    <span className="text-xs">{reply.likes?.length || 0}</span>
                                  </Button>

                                  {isAuthenticated && userId === reply.userId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteReply(comment._id, reply._id)}
                                      className="gap-1 h-6 text-xs px-2 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}