"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, HeartHandshake, Loader2, Ambulance } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

export function AcceptRequestAction({ 
  requestId, 
  bloodGroup, 
  hospitalName 
}: { 
  requestId: string
  bloodGroup: string
  hospitalName?: string 
}) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [needsTransportation, setNeedsTransportation] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || localStorage.getItem("adminToken")
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const handleAcceptClick = () => {
    if (!token) {
      alert("You must be logged in to accept a blood request")
      router.push(`/login?callbackUrl=/request/${requestId}`)
      return
    }
    setShowDialog(true)
  }

  const confirmAccept = async () => {
    if (!token) return
    setIsAccepting(true)
    setError("")

    try {
      const response = await fetch("/api/blood-request/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          bloodRequestId: requestId,
          needsTransportation 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setHasAccepted(true)
        setShowDialog(false)
      } else {
        setError(data.error || "Failed to accept request")
      }
    } catch (err) {
      setError("Error accepting request")
    } finally {
      setIsAccepting(false)
    }
  }

  if (hasAccepted) {
    return (
      <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl border border-emerald-200 flex flex-col items-center justify-center text-center space-y-2 mt-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-xl">You accepted this request</h3>
        <p className="text-sm">
          Please proceed to the hospital as soon as possible. 
          You can track this in your dashboard.
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <Card className="border-red-200 shadow-md overflow-hidden bg-gradient-to-r from-red-50 to-white mt-2">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-2xl text-red-900">Can you help?</h3>
            <p className="text-base text-red-700 mt-1">Your prompt response can save a life today.</p>
          </div>
          <Button 
            className="w-full md:w-auto px-10 h-14 text-lg font-bold bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all rounded-full shrink-0" 
            onClick={handleAcceptClick}
          >
            <HeartHandshake className="w-6 h-6 mr-2" />
            Accept this Request
          </Button>
        </div>
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Blood Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this request for {bloodGroup} blood at {hospitalName || "the hospital"}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-start space-x-3 bg-muted p-4 rounded-lg">
              <Checkbox 
                id="transportation" 
                checked={needsTransportation} 
                onCheckedChange={(checked) => setNeedsTransportation(checked as boolean)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="transportation"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Ambulance className="w-4 h-4 text-primary" />
                  I need transportation assistance
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Check this if you need a free ride to the hospital. Samarpan will arrange transportation for you.
                </p>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isAccepting}>
              Cancel
            </Button>
            <Button onClick={confirmAccept} disabled={isAccepting} className="bg-red-600 hover:bg-red-700 text-white">
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Confirm & Accept"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
