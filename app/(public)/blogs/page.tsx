"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Eye, MessageSquare, Calendar } from "lucide-react"

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
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Resources</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn about blood donation, health tips, and inspiring donor stories from our community.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-2 h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading blogs...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {blogs.length === 0 ? "No blogs published yet." : "No blogs match your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => {
                const thumbnail = getThumbnail(blog.images)
                return (
                  <Link key={blog._id} href={`/blogs/${blog._id}`}>
                    <Card className="overflow-hidden hover:border-primary/50 transition h-full hover:shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                      {/* Thumbnail */}
                      {thumbnail && (
                        <div className="relative h-40 bg-muted overflow-hidden">
                          <img
                            src={thumbnail}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <CardContent className="p-4 space-y-3">
                        {/* Title */}
                        <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition">
                          {blog.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {blog.content}
                        </p>

                        {/* Meta Info */}
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </div>

                          {/* Stats */}
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              {blog.views}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              {blog.comments?.length || 0}
                            </div>
                          </div>

                          {/* Author */}
                          <p className="text-xs text-muted-foreground">By {blog.authorName}</p>
                        </div>

                        {/* Read More Button */}
                        <Button variant="default" size="sm" className="w-full mt-4">
                          Read More
                        </Button>
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