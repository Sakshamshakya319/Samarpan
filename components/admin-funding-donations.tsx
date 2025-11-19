"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, IndianRupee } from "lucide-react"

interface FundingDonation {
  _id: string
  name: string
  email: string
  phone?: string
  message?: string
  amount: number
  currency: string
  orderId: string
  paymentId: string
  status: string
  method?: string
  createdAt: string
}

export function AdminFundingDonations({ token }: { token: string }) {
  const [donations, setDonations] = useState<FundingDonation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDonations()
  }, [token])

  const fetchDonations = async () => {
    if (!token) return
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/funding-donations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDonations(data.donations || [])
      } else {
        const data = await res.json()
        setError(data.error || "Failed to fetch funding donations")
      }
    } catch (err) {
      setError("Error fetching funding donations")
    } finally {
      setIsLoading(false)
    }
  }

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value)

  const totalDonations = donations.length
  const totalReceived = donations
    .filter((d) => (d.status || "").toLowerCase() === "captured")
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5" />
          Funding Donations
        </CardTitle>
        <CardDescription>Monetary donations via Razorpay</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
        ) : donations.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">No funding donations yet</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Total donations: {totalDonations}</div>
              <div className="text-sm font-semibold">Total received: {formatINR(totalReceived)}</div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="font-medium">{d.name || "Anonymous"}</TableCell>
                    <TableCell>{d.email}</TableCell>
                    <TableCell>{d.phone || ""}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{d.orderId}</TableCell>
                    <TableCell>
                      {formatINR(Number(d.amount) || 0)}
                    </TableCell>
                    <TableCell className="capitalize">{d.status}</TableCell>
                    <TableCell className="uppercase">{d.method || ""}</TableCell>
                    <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}