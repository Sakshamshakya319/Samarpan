"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"

interface Registration {
  _id: string
  registrationNumber: string
  name: string
  email: string
  timeSlot: string
  status: string
  createdAt: string
}

interface AdminEventRegistrationsViewerProps {
  eventId: string | null
  token: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminEventRegistrationsViewer({
  eventId,
  token,
  open,
  onOpenChange,
}: AdminEventRegistrationsViewerProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && eventId) {
      fetchRegistrations()
    }
  }, [open, eventId])

  const fetchRegistrations = async () => {
    if (!eventId) return

    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/event-registrations?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations || [])
      } else {
        setError("Failed to fetch registrations")
      }
    } catch (err) {
      setError("Error fetching registrations")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-96 overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Event Registrations</AlertDialogTitle>
          <AlertDialogDescription>
            View all volunteer registrations for this event ({registrations.length} registered)
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading registrations...</span>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No registrations yet</div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg._id}>
                    <TableCell className="font-medium">{reg.registrationNumber}</TableCell>
                    <TableCell>{reg.name}</TableCell>
                    <TableCell>{reg.email}</TableCell>
                    <TableCell>{reg.timeSlot}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reg.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <AlertDialogCancel>Close</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}