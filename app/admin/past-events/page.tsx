"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Event {
  _id: string
  title: string
  eventDate: string
  status: string
  location: string
}

export default function PastEventsPage() {
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await fetch("/api/admin/events?status=completed")
        if (!response.ok) {
          throw new Error("Failed to fetch past events")
        }
        const data = await response.json()
        setPastEvents(data.events)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPastEvents()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastEvents.map((event) => (
              <TableRow key={event._id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>
                  {format(new Date(event.eventDate), "PPP")}
                </TableCell>
                <TableCell>
                  <Badge>{event.status}</Badge>
                </TableCell>
                <TableCell>{event.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}