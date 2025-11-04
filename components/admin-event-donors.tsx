"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Users, Download, AlertCircle, CheckCircle2, FileDown } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"

interface DonorRecord {
  _id: string
  name: string
  email: string
  registrationNumber: string
  timeSlot: string
  qrVerified: boolean
  donationStatus: string
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
}

interface AdminEventDonorsProps {
  eventId?: string
}

export function AdminEventDonors({ eventId }: AdminEventDonorsProps) {
  const { token } = useAppSelector((state) => state.auth)
  const [donors, setDonors] = useState<DonorRecord[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState(eventId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all")

  useEffect(() => {
    if (!eventId) {
      fetchEvents()
    }
  }, [token, eventId])

  useEffect(() => {
    if (selectedEventId) {
      fetchDonors()
    }
  }, [selectedEventId])

  const fetchEvents = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (err) {
      console.error("Error fetching events:", err)
    }
  }

  const fetchDonors = async () => {
    if (!selectedEventId || !token) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/event-donors?eventId=${selectedEventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDonors(data.donors || [])
      } else {
        const data = await response.json()
        setError(data.error || "Failed to fetch donors")
      }
    } catch (err) {
      console.error("Error fetching donors:", err)
      setError("Error loading donors")
    } finally {
      setIsLoading(false)
    }
  }

  const exportToExcel = async () => {
    if (donors.length === 0) {
      setError("No donors to export")
      return
    }

    try {
      // Prepare CSV data
      const headers = [
        "Registration #",
        "Name",
        "Email",
        "Time Slot",
        "Donation Status",
        "Verified",
        "Verified Date",
        "Registration Date",
      ]

      const rows = donors.map((donor) => [
        donor.registrationNumber,
        donor.name,
        donor.email,
        donor.timeSlot,
        donor.donationStatus,
        donor.qrVerified ? "Yes" : "No",
        donor.verifiedAt ? new Date(donor.verifiedAt).toLocaleString() : "-",
        new Date(donor.createdAt).toLocaleString(),
      ])

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n")

      // Download CSV
      const link = document.createElement("a")
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
      link.download = `event-donors-${selectedEventId}-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
    } catch (err) {
      console.error("Error exporting to Excel:", err)
      setError("Failed to export donors")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-amber-100 text-amber-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.registrationNumber.includes(searchTerm)

    if (filterStatus === "completed") return matchesSearch && donor.qrVerified
    if (filterStatus === "pending") return matchesSearch && !donor.qrVerified
    return matchesSearch
  })

  const completedCount = donors.filter((d) => d.qrVerified).length
  const pendingCount = donors.filter((d) => !d.qrVerified).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Event Donors
        </CardTitle>
        <CardDescription>View and manage donors who participated in blood donation events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Selection */}
        {!eventId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Event</label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.title} - {new Date(event.eventDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedEventId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 mb-1 font-medium">Total Donors</p>
                <p className="text-2xl font-bold text-blue-900">{donors.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 mb-1 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">{completedCount}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-600 mb-1 font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <Input
                placeholder="Search by name, email, or registration #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All ({donors.length})
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("completed")}
                >
                  Completed ({completedCount})
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending ({pendingCount})
                </Button>

                <div className="ml-auto">
                  <Button
                    onClick={exportToExcel}
                    disabled={donors.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Donors Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading donors...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : filteredDonors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== "all"
                    ? "No donors found matching your filters"
                    : "No donors registered for this event yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Reg. #</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Time Slot</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">Verified</TableHead>
                      <TableHead className="font-semibold">Verified Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonors.map((donor) => (
                      <TableRow key={donor._id}>
                        <TableCell className="font-mono font-semibold text-sm">
                          {donor.registrationNumber}
                        </TableCell>
                        <TableCell className="font-medium">{donor.name}</TableCell>
                        <TableCell className="text-sm">{donor.email}</TableCell>
                        <TableCell className="text-sm">{donor.timeSlot}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(donor.donationStatus)}>
                            {donor.donationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {donor.qrVerified ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-amber-400 rounded-full mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {donor.verifiedAt
                            ? new Date(donor.verifiedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}