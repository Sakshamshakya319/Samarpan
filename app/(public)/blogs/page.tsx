"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdaptiveImage } from "@/components/shared/adaptive-image"
import { Loader2, Search, Eye, MessageSquare, Calendar, ArrowRight } from "lucide-react"

interface Blog {
  _id: string
  title: string
  content: string
  images: any[]
  createdAt: string
  views: number
  comments: any[]
  authorName: string
  status: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    const filtered = blogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredBlogs(filtered)
  }, [searchQuery, blogs])

  const fetchBlogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/blogs")
      if (response.ok) {
        const data = await response.json()
        setBlogs(data.blogs || [])
      }
    } catch (error) {
      console.error("Error fetching blogs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getThumbnail = (images: any[]) => {
    return images.find((img) => img.isThumbnail)?.url || images[0]?.url
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white py-16 md:py-24 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Blog & Resources
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
            Explore our latest articles, medical resources, and inspiring stories from the Samarpan donor community.
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles and resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-base bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-red-500 rounded-full shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Loading resources...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-100 max-w-2xl mx-auto">
              <p className="text-slate-500 font-medium">
                {blogs.length === 0 ? "No articles have been published yet." : "No articles match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => {
                const thumbnail = getThumbnail(blog.images)
                return (
                  <Link key={blog._id} href={`/blogs/${blog._id}`} className="group flex flex-col h-full">
                    <Card className="flex flex-col h-full bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 rounded-xl overflow-hidden">
                      {/* Thumbnail */}
                      {thumbnail ? (
                        <div className="w-full h-56 relative overflow-hidden bg-slate-100 border-b border-slate-100">
                          <AdaptiveImage
                            src={thumbnail}
                            alt={blog.title}
                            maxHeight={250}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 bg-slate-100 border-b border-slate-100 flex items-center justify-center">
                          <span className="text-slate-400 font-medium">No Image Available</span>
                        </div>
                      )}

                      <CardContent className="p-6 flex flex-col flex-grow">
                        {/* Meta Info Top */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-red-600 transition-colors">
                          {blog.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-slate-600 line-clamp-3 mb-6 text-sm leading-relaxed flex-grow">
                          {blog.content}
                        </p>

                        {/* Footer (Stats & Read More) */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <Eye className="w-3.5 h-3.5" />
                              {blog.views}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {blog.comments?.length || 0}
                            </div>
                          </div>
                          
                          <span className="text-sm font-semibold text-red-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read Article <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}