"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Droplet, User, Calendar, Award, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BloodDonationHistory {
  _id: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  bloodGroup: string
  quantity: number
  donationDate: string
  donationType: "request" | "event" | "direct"
  requestId?: string
  eventId?: string
  pointsAwarded: number
  certificateIssued: boolean
  status: "completed" | "pending" | "cancelled"
  notes?: string
}

interface AdminBloodHistoryProps {
  token: string
}

export function AdminBloodHistory({ token }: AdminBloodHistoryProps) {
  const [donations, setDonations] = useState<BloodDonationHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [bloodGroupFilter, setBloodGroupFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  useEffect(() => {
    fetchDonationHistory()
  }, [token])

  const fetchDonationHistory = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/blood-history", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations || [])
      } else {
        setError("Failed to load donation history")
      }
    } catch (err) {
      setError("Error fetching donation history")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAwardPoints = async (donationId: string, userId: string) => {
    try {
      const response = await fetch("/api/admin/award-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          donationId,
          userId,
          points: 10,
          reason: "Blood donation reward",
        }),
      })

      if (response.ok) {
        setSuccessMessage("Points awarded successfully!")
        fetchDonationHistory() // Refresh the list
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to award points")
      }
    } catch (err) {
      setError("Error awarding points")
      console.error(err)
    }
  }

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBloodGroup = !bloodGroupFilter || donation.bloodGroup === bloodGroupFilter
    const matchesType = !typeFilter || donation.donationType === typeFilter
    
    return matchesSearch && matchesBloodGroup && matchesType
  })

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  const donationTypes = [
    { value: "", label: "All Types" },
    { value: "request", label: "Request Response" },
    { value: "event", label: "Event Donation" },
    { value: "direct", label: "Direct Donation" }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Loading donation history...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-100 text-green-800 rounded-md text-sm flex items-start gap-2">
          <Award className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600" />
            Blood Donation History
          </CardTitle>
          <CardDescription>
            Complete history of all blood donations with points tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or blood group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Groups</SelectItem>
                {bloodGroups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Donation Type" />
              </SelectTrigger>
              <SelectContent>
                {donationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Donations</p>
                  <p className="text-2xl font-bold text-blue-900">{donations.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Points</p>
                  <p className="text-2xl font-bold text-green-900">
                    {donations.reduce((sum, d) => sum + d.pointsAwarded, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Unique Donors</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {new Set(donations.map(d => d.userId)).size}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">This Month</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {donations.filter(d => {
                      const donationDate = new Date(d.donationDate)
                      const now = new Date()
                      return donationDate.getMonth() === now.getMonth() && 
                             donationDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Donations Table */}
          {filteredDonations.length === 0 ? (
            <div className="text-center py-8">
              <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No donation history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{donation.userName}</p>
                          <p className="text-sm text-gray-500">{donation.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">
                          {donation.bloodGroup}
                        </Badge>
                      </TableCell>
                      <TableCell>{donation.quantity} units</TableCell>
                      <TableCell>
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={donation.donationType === "request" ? "default" : 
                                  donation.donationType === "event" ? "secondary" : "outline"}
                        >
                          {donation.donationType === "request" ? "Request" : 
                           donation.donationType === "event" ? "Event" : "Direct"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={donation.status === "completed" ? "default" : 
                                  donation.status === "pending" ? "secondary" : "destructive"}
                        >
                          {donation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          {donation.pointsAwarded}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={donation.certificateIssued ? "default" : "outline"}
                          className={donation.certificateIssued ? "bg-green-100 text-green-800" : ""}
                        >
                          {donation.certificateIssued ? "Issued" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {donation.status === "completed" && donation.pointsAwarded === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAwardPoints(donation._id, donation.userId)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              Award 10 Points
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}