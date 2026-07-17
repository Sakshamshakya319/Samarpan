"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AdaptiveImage } from "@/components/shared/adaptive-image"
import { Loader2, Eye, MessageSquare, Calendar, User, Trash2, AlertCircle, ArrowLeft, Heart, MessageCircle, X, Share2, Mail, Facebook, Instagram } from "lucide-react"
import { useAppSelector } from "@/lib/store/hooks"

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

  // Note: Lightbox state removed for simplicity in minimalist design, images open full-size normally

  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

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
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ text: commentText }),
      })

      if (response.ok) {
        setCommentSuccess("Comment added successfully!")
        setCommentText("")
        await fetchBlog()
        setTimeout(() => setCommentSuccess(""), 3000)
      } else {
        const data = await response.json()
        setCommentError(data.error || "Failed to add comment")
      }
    } catch (err) {
      setCommentError("Error adding comment. Please try again.")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return
    if (!userToken) return

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userToken}` },
      })
      if (response.ok) {
        await fetchBlog()
      }
    } catch (err) {
      console.error(err)
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
        if (isLiked) likedComments.delete(commentId)
        else likedComments.add(commentId)
        setLikedComments(new Set(likedComments))
        await fetchBlog()
      }
    } catch (err) {
      console.error(err)
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
        setCommentError(data.error || "Failed to add reply")
      }
    } catch (err) {
      setCommentError("Error adding reply. Please try again.")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm("Delete this reply?")) return
    if (!userToken) return

    try {
      const response = await fetch(`/api/blogs/${blogId}/comments/${commentId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userToken}` },
      })
      if (response.ok) await fetchBlog()
    } catch (err) {
      console.error(err)
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
        if (isLiked) likedReplies.delete(likeId)
        else likedReplies.add(likeId)
        setLikedReplies(new Set(likedReplies))
        await fetchBlog()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleShareBlog = (platform: string) => {
    const blogUrl = typeof window !== "undefined" ? window.location.href : ""
    const title = blog?.title || "Check out this blog"
    const text = `${title} - Read on Samarpan`

    const shares = {
      facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`, "_blank", "width=600,height=400"),
      whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + blogUrl)}`, "_blank"),
      twitter: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(title)}`, "_blank", "width=600,height=400"),
      mail: () => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + blogUrl)}` },
      instagram: () => {
        alert("To share on Instagram, copy the link and paste it.")
        navigator.clipboard.writeText(blogUrl)
      },
      copy: () => navigator.clipboard.writeText(blogUrl).then(() => alert("Link copied to clipboard!")),
    }

    const shareFunc = shares[platform as keyof typeof shares]
    if (shareFunc) shareFunc()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Loading article...</p>
        </div>
      </main>
    )
  }

  if (error || !blog) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900 mb-6">{error || "Blog not found"}</p>
          <Link href="/blogs">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Blogs
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  const thumbnailImage = blog.images.find((img) => img.isThumbnail) || blog.images[0]
  const galleryImages = blog.images.filter(img => !img.isThumbnail)

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Top Navigation Row */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <Link href="/blogs" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-red-600 transition-colors gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back to Blogs
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Article Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-6 tracking-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 py-4 border-y border-slate-100">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {blog.authorName}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" />
                {blog.views} views
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                {blog.comments.length} comments
              </div>
            </div>

            {/* Flat Social Share Icons */}
            <div className="flex items-center gap-1">
              <button onClick={() => handleShareBlog("facebook")} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Facebook">
                <Facebook className="w-4 h-4" />
              </button>
              <button onClick={() => handleShareBlog("twitter")} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7-2.25 1.5-2.25 1.5-4.5-.25"/></svg>
              </button>
              <button onClick={() => handleShareBlog("whatsapp")} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.73 1.16l-.335.198-3.476.523.529 3.372.38.183c.247.123.486.271.707.445 3.282 2.817 8.125 2.51 11.044-.566 1.231-1.268 2.077-3.016 2.288-4.853.055-.468.034-.933-.017-1.395 0-.036 0-.073-.003-.109-.15-.864-.787-1.618-1.675-1.822-.34-.066-.686-.053-1.024.044-1.297.349-2.572 1.336-3.226 2.565-.224.433-.427.923-.586 1.457-.04.134-.082.269-.124.402z"/></svg>
              </button>
              <button onClick={() => handleShareBlog("copy")} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Copy Link">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {thumbnailImage && (
          <div className="mb-12">
            <AdaptiveImage
              src={thumbnailImage.url}
              alt={blog.title}
              maxHeight={500}
              showCaption={!!thumbnailImage.caption}
              caption={thumbnailImage.caption}
              priority={true}
              className="rounded-xl w-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="prose prose-slate prose-lg max-w-none text-slate-800 leading-relaxed mb-16">
          <div className="whitespace-pre-wrap font-sans">
            {blog.content}
          </div>
        </div>

        {/* Additional Images / Gallery */}
        {galleryImages && galleryImages.length > 0 && (
          <div className="mt-16 mb-16 border-t border-slate-100 pt-10">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {galleryImages.map((image, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <AdaptiveImage
                    src={image.url}
                    alt={`Gallery Image ${idx + 1}`}
                    maxHeight={300}
                    showCaption={!!image.caption}
                    caption={image.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t border-slate-200 pt-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Responses ({blog.comments.length})</h3>

          {/* Add Comment Input */}
          <div className="mb-12">
            {isAuthenticated ? (
              <form onSubmit={handleAddComment}>
                {commentError && (
                  <div className="mb-4 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {commentError}
                  </div>
                )}
                {commentSuccess && (
                  <div className="mb-4 text-sm text-green-700">{commentSuccess}</div>
                )}
                <div className="bg-white border border-slate-200 focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 transition-all rounded-xl p-4">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="border-0 focus-visible:ring-0 p-0 text-slate-700 resize-none min-h-[80px]"
                  />
                  <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
                    <Button 
                      type="submit" 
                      disabled={isSubmittingComment || !commentText.trim()} 
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6"
                      size="sm"
                    >
                      {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Respond"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center">
                <p className="text-slate-600 mb-4">You must be logged in to leave a response.</p>
                <Link href="/login">
                  <Button variant="outline" className="rounded-full">Log In to Respond</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-0">
            {blog.comments.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No responses yet. Be the first to share your thoughts.</p>
            ) : (
              blog.comments.map((comment) => (
                <div key={comment._id} className="py-6 border-b border-slate-100 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{comment.userName}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm mb-3">
                        {comment.text}
                      </p>

                      {/* Comment Actions */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedComments.has(comment._id) ? "fill-red-500 text-red-500" : ""}`} />
                          {comment.likes?.length || 0}
                        </button>

                        <button
                          onClick={() => setReplyingToCommentId(replyingToCommentId === comment._id ? null : comment._id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Reply
                        </button>

                        {isAuthenticated && userId === comment.userId && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyingToCommentId === comment._id && (
                        <form onSubmit={(e) => handleAddReply(e, comment._id)} className="mt-4">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="border-0 focus-visible:ring-0 p-0 text-slate-700 resize-none min-h-[60px] bg-transparent text-sm"
                            />
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                              <button type="button" onClick={() => setReplyingToCommentId(null)} className="text-xs text-slate-500 font-medium">Cancel</button>
                              <Button 
                                type="submit" 
                                disabled={isSubmittingReply || !replyText.trim()} 
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-7 px-4 text-xs"
                              >
                                {isSubmittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
                              </Button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-5 pl-4 border-l-2 border-slate-100 space-y-5">
                          {comment.replies.map((reply) => (
                            <div key={reply._id}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-slate-900">{reply.userName}</span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-slate-700 whitespace-pre-wrap text-sm mb-2">
                                {reply.text}
                              </p>
                              
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleLikeReply(comment._id, reply._id)}
                                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${likedReplies.has(`${comment._id}-${reply._id}`) ? "fill-red-500 text-red-500" : ""}`} />
                                  {reply.likes?.length || 0}
                                </button>

                                {isAuthenticated && userId === reply.userId && (
                                  <button
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors ml-auto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </article>
    </main>
  )
}