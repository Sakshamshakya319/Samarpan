"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdaptiveImage } from "@/components/adaptive-image"

interface ImageLightboxProps {
  images: Array<{
    url: string
    caption?: string
    isThumbnail?: boolean
  }>
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentIndex])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setIsZoomed(false)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setIsZoomed(false)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = images[currentIndex].url
    link.download = `image-${currentIndex + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  const currentImage = images[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white text-sm">
          {currentIndex + 1} of {images.length}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsZoomed(!isZoomed)}
            className="text-white hover:bg-white/20"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <Button
            size="lg"
            variant="ghost"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Image */}
      <div 
        className={`max-w-[90vw] max-h-[90vh] transition-transform duration-300 ${
          isZoomed ? "scale-150" : "scale-100"
        } ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <AdaptiveImage
          src={currentImage.url}
          alt={`Image ${currentIndex + 1}`}
          maxHeight={window.innerHeight * 0.9}
          maxWidth={window.innerWidth * 0.9}
          showCaption={!!currentImage.caption}
          caption={currentImage.caption}
          priority={true}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsZoomed(false)
              }}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                index === currentIndex ? "border-white" : "border-transparent"
              }`}
            >
              <img
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Background overlay */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  )
}