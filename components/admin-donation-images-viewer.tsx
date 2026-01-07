"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Image, MapPin, User, Loader2, Eye, Check, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DonationImage {
  _id: string
  userId: string
  userEmail?: string
  imageData: string
  imageType?: string
  geolocation: {
    latitude: number
    longitude: number
    locationName: string
  }
  status: string
  uploadedAt: string
}

interface AdminDonationImagesViewerProps {
  token: string | null
}

export function AdminDonationImagesViewer({ token }: AdminDonationImagesViewerProps) {
  const [images, setImages] = useState<DonationImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedImage, setSelectedImage] = useState<DonationImage | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)

  useEffect(() => {
    fetchDonationImages()
  }, [token])

  const fetchDonationImages = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/donation-images?admin=true", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      } else {
        setError("Failed to fetch donation images")
      }
    } catch (err) {
      setError("Error fetching donation images")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getImageDataUri = (image: DonationImage): string => {
    if (!image.imageData) {
      return ""
    }
    
    // Check if it's already a data URI
    if (image.imageData.startsWith("data:")) {
      return image.imageData
    }
    
    // Construct data URI from base64 data
    const imageType = image.imageType || "image/jpeg"
    return `data:${imageType};base64,${image.imageData}`
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const handleImageClick = (image: DonationImage) => {
    setSelectedImage(image)
    setShowPreview(true)
    setImageLoadError(false)
    setError("")
  }

  const handleApproveReject = async (status: "approved" | "rejected") => {
    if (!selectedImage) return

    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/donation-images/${selectedImage._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setSuccess(`Image ${status} successfully!`)
        
        // Update the image in the list
        setImages(
          images.map((img) =>
            img._id === selectedImage._id ? { ...img, status } : img
          ),
        )

        // Update selected image
        setSelectedImage({ ...selectedImage, status })

        setTimeout(() => {
          setShowPreview(false)
          setSuccess("")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update image status")
      }
    } catch (err) {
      setError("Error updating image status")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading donation images...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Donation Proof Images
          </CardTitle>
          <CardDescription>
            Review and verify geo-tagged donation images uploaded by donors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm mb-4">{success}</div>}

          {images.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No donation images uploaded yet.</p>
              <p className="text-sm text-gray-500 mt-2">Uploaded images will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition bg-white"
                >
                  {/* Image Thumbnail */}
                  <div className="relative bg-gray-100 h-40 overflow-hidden cursor-pointer group flex items-center justify-center">
                    <img
                      src={getImageDataUri(image)}
                      alt="Donation proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onClick={() => handleImageClick(image)}
                      onError={(e) => {
                        console.error("Image load error for", image._id, ":", e)
                        // Show placeholder on error
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                    <button
                      onClick={() => handleImageClick(image)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <Eye className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {/* Image Info */}
                  <div className="p-3 space-y-2">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusBadgeColor(image.status)} capitalize text-xs`}>
                        {image.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Location Info */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="text-gray-700">{image.geolocation.locationName}</p>
                        <p className="text-gray-500 font-mono text-xs">
                          {image.geolocation.latitude.toFixed(4)}, {image.geolocation.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <p className="text-xs text-gray-600 truncate">
                        Email: <span className="font-mono">{image.userEmail || "Loading..."}</span>
                      </p>
                    </div>

                    {/* View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleImageClick(image)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-lg w-11/12 max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={() => setShowPreview(false)}
            className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-md p-1 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <AlertDialogHeader className="pr-8">
            <AlertDialogTitle>Donation Proof Image</AlertDialogTitle>
            <AlertDialogDescription>Review the geo-tagged donation image</AlertDialogDescription>
          </AlertDialogHeader>

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{success}</div>}

          {selectedImage && (
            <div className="space-y-4">
              {/* Full Image */}
              <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-96">
                {imageLoadError ? (
                  <div className="text-center p-8">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium mb-1">Unable to Display Image</p>
                    <p className="text-sm text-gray-500 mb-4">The image data may be corrupted. Please ask the donor to re-upload.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageLoadError(false)
                        setTimeout(() => window.location.reload(), 500)
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <img
                    src={getImageDataUri(selectedImage)}
                    alt="Donation proof"
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      console.error("Full image load error:", e)
                      setImageLoadError(true)
                    }}
                  />
                )}
              </div>

              {/* Image Details */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {/* Upload Date */}
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Upload Date & Time</p>
                  <p className="text-sm font-mono">
                    {new Date(selectedImage.uploadedAt).toLocaleString()}
                  </p>
                </div>

                {/* Location Details */}
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Geolocation
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Location:</span> {selectedImage.geolocation.locationName}
                    </p>
                    <p className="text-sm font-mono text-gray-600">
                      Coordinates: {selectedImage.geolocation.latitude.toFixed(6)},{" "}
                      {selectedImage.geolocation.longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/${selectedImage.geolocation.latitude},${selectedImage.geolocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>

                {/* User Email */}
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Donor Email
                  </p>
                  <p className="text-sm font-mono break-all">{selectedImage.userEmail || "Unknown"}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Verification Status</p>
                  <Badge className={`${getStatusBadgeColor(selectedImage.status)} capitalize`}>
                    {selectedImage.status}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedImage.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => handleApproveReject("approved")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleApproveReject("rejected")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}