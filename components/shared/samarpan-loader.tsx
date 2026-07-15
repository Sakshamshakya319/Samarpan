"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SamarpanLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  showIcon?: boolean
  className?: string
  useBloodImage?: boolean
}

export function SamarpanLoader({ 
  size = "md", 
  showText = true, 
  showIcon = true,
  className = "",
  useBloodImage = false
}: SamarpanLoaderProps) {
  const [currentDot, setCurrentDot] = useState(0)

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  }

  const imageSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 }
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 3)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Samarpan Logo with Animation - Only show if using blood image (Maintenance) */}
      {showIcon && useBloodImage && (
        <div className="relative">
          <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
            {/* Blood drop image for maintenance page */}
            <div className="animate-pulse">
              <Image
                src="/maintenance/blood.png"
                alt="Blood Drop"
                width={imageSizes[size].width}
                height={imageSizes[size].height}
                className="object-contain"
                priority
              />
            </div>
            
            {/* Pulsing effect */}
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
          </div>
        </div>
      )}

      {/* Loading text with animated dots */}
      {showText && (
        <div className="text-center space-y-2">
          <div className={`font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent ${textSizes[size]}`}>
            SAMARPAN
          </div>
          <div className={`text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
            Loading
            <span className="inline-flex ml-1">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={`w-1 h-1 mx-0.5 rounded-full bg-current transition-opacity duration-300 ${
                    currentDot === index ? 'opacity-100' : 'opacity-30'
                  }`}
                />
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Fullscreen loader variant
export function SamarpanFullscreenLoader({ 
  message = "Loading...", 
  useBloodImage = false,
  showIcon = true
}: { 
  message?: string
  useBloodImage?: boolean
  showIcon?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        <SamarpanLoader size="xl" showText={true} useBloodImage={useBloodImage} showIcon={showIcon} />
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
          {message}
        </p>
      </div>
    </div>
  )
}