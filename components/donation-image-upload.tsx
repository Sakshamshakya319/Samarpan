"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Camera, MapPin, Check, Loader2 } from "lucide-react"
import Image from "next/image"
import { useAppSelector } from "@/lib/hooks"
import { useGeolocation } from "@/hooks/use-geolocation"

interface DonationImageUploadProps {
  acceptedRequestId?: string
}

export function DonationImageUpload({ acceptedRequestId }: DonationImageUploadProps) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { token } = useAppSelector((state) => state.auth)

  // Use the geolocation hook
  const { latitude, longitude, locationName, loading: geoLoading, permission: geoPermission, error: geoError, requestLocation } = useGeolocation()

  useEffect(() => {
    // Request geolocation when component mounts
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    // Set error from geolocation if it exists and component error is not already set
    if (geoError && !error) {
      setError(geoError)
    }
  }, [geoError, error])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        // Extract only the base64 part (without data:image/..;base64, prefix) for storage
        const base64Data = base64String.includes(',') 
          ? base64String.split(',')[1] 
          : base64String
        setImageData(base64Data)
        // Store full data URI for preview
        setImagePreview(base64String)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!imageData) {
      setError("Please select an image to upload")
      return
    }

    if (latitude === null || longitude === null) {
      setError("Geolocation data is required. Please enable location services.")
      return
    }

    if (!token) {
      setError("You must be logged in to upload images")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/donation-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData,
          latitude,
          longitude,
          locationName,
          acceptedRequestId: acceptedRequestId || null,
        }),
      })

      if (response.ok) {
        setSuccess("Donation image uploaded successfully! Thank you for your contribution.")
        setImageData(null)
        setImagePreview(null)
        setTimeout(() => setSuccess(""), 5000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to upload image")
      }
    } catch (err) {
      setError("Error uploading image")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Upload Donation Proof
          </CardTitle>
          <CardDescription>Upload a geo-tagged photo of your blood donation for verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>{success}</div>
              </div>
            )}

            {/* Geolocation Status */}
            <div className={`p-3 border rounded-md ${geoLoading ? 'bg-yellow-50' : geoPermission === "granted" ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {geoLoading && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Detecting Location...
                    </Badge>
                  )}
                  {!geoLoading && geoPermission === "granted" && (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Location Enabled
                    </Badge>
                  )}
                  {!geoLoading && geoPermission === "denied" && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Location Disabled
                    </Badge>
                  )}
                </div>
                <div className="flex-1">
                  {geoLoading && (
                    <div className="text-sm text-yellow-900">
                      <p className="font-medium">Getting your location...</p>
                      <p className="text-xs mt-1">Please allow location access when prompted by your browser.</p>
                    </div>
                  )}
                  {!geoLoading && geoPermission === "granted" && latitude && longitude && (
                    <div className="text-sm text-green-900">
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Your Location: {locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                      </p>
                      <p className="text-xs mt-1 text-green-700">✓ Location successfully acquired and will be attached to your donation proof.</p>
                    </div>
                  )}
                  {!geoLoading && geoPermission === "denied" && (
                    <div className="text-sm text-red-900">
                      <p className="font-medium">Location Access Required</p>
                      <p className="text-xs mt-1">{error || "Please enable location services in your browser to continue."}</p>
                      <Button
                        type="button"
                        onClick={requestLocation}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        🔄 Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label htmlFor="donationImage" className="text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Upload Geo-Tagged Image
              </label>
              <Input
                id="donationImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={geoPermission !== "granted"}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                📍 This image will be tagged with your current location automatically
              </p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="text-xs text-gray-600 mb-2">Image Preview:</div>
                <Image
                  src={imagePreview}
                  alt="Donation proof preview"
                  width={256}
                  height={128}
                  className="object-cover rounded"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageData(null)
                    setImagePreview(null)
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Remove Image
                </button>
              </div>
            )}

            {/* Alert Box */}
            <div className="p-3 border border-orange-200 rounded-md bg-orange-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-900">
                  <p className="font-medium mb-1">📸 Important: Geo-Tagged Photo Required</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Take a clear photo of yourself with the blood donation center/hospital</li>
                    <li>Ensure your location services are enabled</li>
                    <li>This photo will be geo-tagged with your current location</li>
                    <li>Admin will verify the donation through this geo-tagged image</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || geoPermission !== "granted" || !imageData}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Donation Proof
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
            </p>
          </form>
        </CardContent>
      </Card>


    </>
  )
}