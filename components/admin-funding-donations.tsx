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
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalDonations}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Donations</div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{formatINR(totalReceived)}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Received</div>
                </div>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3 sm:space-y-4">
              {donations.map((d) => (
                <Card key={d._id} className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{d.name || "Anonymous"}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{d.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-bold text-green-600">{formatINR(Number(d.amount) || 0)}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          d.status.toLowerCase() === 'captured' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {d.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                      {d.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium truncate">{d.phone}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Order ID:</span>
                        <p className="font-mono text-xs break-all">{d.orderId}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <p className="font-medium uppercase truncate">{d.method || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium truncate">{new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {d.message && (
                        <div>
                          <span className="text-muted-foreground">Message:</span>
                          <p className="text-xs sm:text-sm italic line-clamp-2">{d.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Donor</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Order ID</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell className="font-medium">{d.name || "Anonymous"}</TableCell>
                      <TableCell>{d.email}</TableCell>
                      <TableCell>{d.phone || "-"}</TableCell>
                      <TableCell className="font-mono text-xs break-all max-w-32">{d.orderId}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatINR(Number(d.amount) || 0)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          d.status.toLowerCase() === 'captured' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell className="uppercase">{d.method || "-"}</TableCell>
                      <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}