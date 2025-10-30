"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAppSelector } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UserProfile {
  id: string
  email: string
  name: string
  bloodGroup: string
  location: string
  phone: string
  lastDonationDate?: string
  totalDonations: number
  hasDisease?: boolean
  diseaseDescription?: string
}

export function UserProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    location: "",
    phone: "",
    lastDonationDate: "",
    hasDisease: false,
    diseaseDescription: "",
  })
  const { token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    fetchProfile()
  }, [token])

  const fetchProfile = async () => {
    if (!token) return
    try {
      const response = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          name: data.user.name,
          bloodGroup: data.user.bloodGroup,
          location: data.user.location,
          phone: data.user.phone,
          lastDonationDate: data.user.lastDonationDate || "",
          hasDisease: data.user.hasDisease || false,
          diseaseDescription: data.user.diseaseDescription || "",
        })
      }
    } catch (err) {
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsEditing(false)
        fetchProfile()
      } else {
        setError("Failed to update profile")
      }
    } catch (err) {
      setError("Error updating profile")
    }
  }

  if (isLoading) {
    return <div className="text-center">Loading profile...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Manage your donation profile</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>}

        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{profile?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <p className="font-medium">{profile?.bloodGroup || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{profile?.phone || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{profile?.location || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Donations</p>
                <p className="font-medium">{profile?.totalDonations || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Donation Date</p>
                <p className="font-medium">{profile?.lastDonationDate || "Not recorded"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Has Disease</p>
                <p className="font-medium">{profile?.hasDisease ? "Yes" : "No"}</p>
              </div>
              {profile?.hasDisease && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Disease Description</p>
                  <p className="font-medium">{profile?.diseaseDescription || "No description"}</p>
                </div>
              )}
            </div>
            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="">Select Blood Group</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Donation Date</label>
              <Input
                type="date"
                value={formData.lastDonationDate}
                onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasDisease}
                  onChange={(e) => setFormData({ ...formData, hasDisease: e.target.checked })}
                  className="w-4 h-4"
                />
                I have a disease or health condition
              </label>
            </div>
            {formData.hasDisease && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Disease/Health Condition Description</label>
                <textarea
                  value={formData.diseaseDescription}
                  onChange={(e) => setFormData({ ...formData, diseaseDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Please describe your disease or health condition..."
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
