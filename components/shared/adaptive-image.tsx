"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface AdaptiveImageProps {
  src: string
  alt: string
  className?: string
  maxHeight?: number
  maxWidth?: number
  showCaption?: boolean
  caption?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

export function AdaptiveImage({
  src,
  alt,
  className = "",
  maxHeight = 600,
  maxWidth,
  showCaption = false,
  caption,
  priority = false,
  onLoad,
  onError,
}: AdaptiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (src) {
      setIsLoading(true)
      setHasError(false)
      
      // Preload image to get dimensions
      const img = new Image()
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        setIsLoading(false)
        onLoad?.()
      }
      img.onerror = () => {
        setHasError(true)
        setIsLoading(false)
        onError?.()
      }
      img.src = src
    }
  }, [src, onLoad, onError])

  const getOptimalDimensions = () => {
    if (!dimensions) return {}

    const { width: naturalWidth, height: naturalHeight } = dimensions
    const aspectRatio = naturalWidth / naturalHeight

    let displayWidth = naturalWidth
    let displayHeight = naturalHeight

    // Apply max constraints
    if (maxWidth && displayWidth > maxWidth) {
      displayWidth = maxWidth
      displayHeight = displayWidth / aspectRatio
    }

    if (maxHeight && displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = displayHeight * aspectRatio
    }

    return {
      width: Math.round(displayWidth),
      height: Math.round(displayHeight),
    }
  }

  const optimalDimensions = getOptimalDimensions()

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-8 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-muted rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-auto object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={{
          maxWidth: maxWidth ? `${maxWidth}px` : "100%",
          maxHeight: maxHeight ? `${maxHeight}px` : "none",
          ...optimalDimensions,
        }}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => {
          setIsLoading(false)
          onLoad?.()
        }}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
          onError?.()
        }}
      />
      
      {showCaption && caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm">{caption}</p>
        </div>
      )}
    </div>
  )
}

// Hook for getting image dimensions
export function useImageDimensions(src: string) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!src) {
      setDimensions(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const img = new Image()
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      setIsLoading(false)
    }
    img.onerror = () => {
      setError("Failed to load image")
      setIsLoading(false)
    }
    img.src = src
  }, [src])

  return { dimensions, isLoading, error }
}