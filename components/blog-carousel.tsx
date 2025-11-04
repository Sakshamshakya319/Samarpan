"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, MessageSquare, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

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

export function BlogCarousel() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBlogs()
  }, [])

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

  const truncateToWords = (text: string, wordCount: number = 10) => {
    if (!text) return ""
    const words = text.trim().split(/\s+/)
    if (words.length <= wordCount) return text
    return words.slice(0, wordCount).join(" ") + "..."
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (blogs.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Latest Blog Posts</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover inspiring stories, health tips, and insights from our community about blood donation.
          </p>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
          >
            <CarouselContent>
              {blogs.map((blog) => {
                const thumbnail = getThumbnail(blog.images)
                return (
                  <CarouselItem key={blog._id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                    <Link href={`/blogs/${blog._id}`}>
                      <Card className="overflow-hidden h-full hover:border-primary/50 transition hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                        {/* Image Container */}
                        {thumbnail && (
                          <div className="relative h-48 bg-muted overflow-hidden">
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

                          {/* Excerpt - 10 words */}
                          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                            {truncateToWords(blog.content, 10)}
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
                          <Button variant="default" size="sm" className="w-full mt-3">
                            Read More
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                )
              })}
            </CarouselContent>

            <CarouselPrevious className="absolute -left-12 md:left-0 top-1/3 -translate-y-1/2 hover:bg-primary hover:text-white border-2 border-primary hover:border-primary" />
            <CarouselNext className="absolute -right-12 md:right-0 top-1/3 -translate-y-1/2 hover:bg-primary hover:text-white border-2 border-primary hover:border-primary" />
          </Carousel>
        </div>

        {/* View All Blogs Button */}
        <div className="text-center mt-12">
          <Link href="/blogs">
            <Button size="lg" variant="outline">
              View All Blog Posts
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}