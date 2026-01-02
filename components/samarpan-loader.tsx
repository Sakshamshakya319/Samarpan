"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SamarpanLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
  useBloodImage?: boolean
}

export function SamarpanLoader({ 
  size = "md", 
  showText = true, 
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
      {/* Samarpan Logo with Animation */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-r-orange-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-400 border-l-orange-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {useBloodImage ? (
                /* Blood drop image for maintenance page */
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
              ) : (
                /* Heart symbol representing donation/care */
                <div className="text-red-500 animate-pulse">
                  <svg 
                    className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-16 h-16'}`}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              )}
              
              {/* Pulsing effect */}
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
            </div>
          </div>
        </div>
      </div>

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
  useBloodImage = false 
}: { 
  message?: string
  useBloodImage?: boolean 
}) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        <SamarpanLoader size="xl" showText={true} useBloodImage={useBloodImage} />
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
          {message}
        </p>
      </div>
    </div>
  )
}