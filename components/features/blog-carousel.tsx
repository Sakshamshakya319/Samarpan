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
import { AdaptiveImage } from "@/components/shared/adaptive-image"
import { Loader2, Eye, MessageSquare, Calendar } from "lucide-react"

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
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border-t border-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <span className="text-slate-500 font-medium">Loading latest stories...</span>
      </div>
    )
  }

  if (blogs.length === 0) {
    return null
  }

  return (
    <section className="py-24 md:py-32 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-slate-900 tracking-tight">Latest Stories</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Discover inspiring stories, health tips, and insights from our community about blood donation.
          </p>
        </div>

        <div className="relative group px-12 md:px-0">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-4">
              {blogs.map((blog) => {
                const thumbnail = getThumbnail(blog.images)
                return (
                  <CarouselItem key={blog._id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Link href={`/blogs/${blog._id}`} className="block h-full">
                      <Card className="h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-slate-300 transition-colors cursor-pointer flex flex-col">
                        {/* Image Container */}
                        {thumbnail && (
                          <div className="border-b border-slate-100">
                            <AdaptiveImage
                              src={thumbnail}
                              alt={blog.title}
                              maxHeight={220}
                              className="rounded-t-xl object-cover w-full h-[220px]"
                            />
                          </div>
                        )}

                        <CardContent className="p-6 flex-1 flex flex-col">
                          {/* Title */}
                          <h3 className="font-heading font-semibold text-lg line-clamp-2 text-slate-900 hover:text-slate-600 transition-colors mb-3 leading-snug">
                            {blog.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
                            {truncateToWords(blog.content, 12)}
                          </p>

                          {/* Meta Info */}
                          <div className="mt-auto space-y-4">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                              <span className="text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md">By {blog.authorName}</span>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-slate-400" />
                                {blog.views}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                {blog.comments?.length || 0}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                )
              })}
            </CarouselContent>

            <CarouselPrevious className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-10 h-10 shadow-sm transition-all" />
            <CarouselNext className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-10 h-10 shadow-sm transition-all" />
          </Carousel>
        </div>

        {/* View All Blogs Button */}
        <div className="text-center mt-16">
          <Link href="/blogs">
            <Button size="lg" variant="outline" className="h-12 px-8 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              View All Stories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}