"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Heart } from "lucide-react"

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false)
      return
    }
    if (document.getElementById("razorpay-script")) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.id = "razorpay-script"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function FundingPage() {
  const [amount, setAmount] = useState<string>("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadRazorpayScript()
  }, [])

  const startPayment = async () => {
    setError("")
    setSuccess("")
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !name || !email || !phone) {
      setError("Please enter a valid amount, name, email, and phone")
      return
    }

    setIsProcessing(true)
    try {
      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, name, email, phone, message }),
      })
      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create order")
      }
      const orderData = await orderRes.json()

      const ok = await loadRazorpayScript()
      if (!ok) {
        throw new Error("Failed to load payment SDK")
      }

      const opts: any = {
        key: orderData.keyId,
        amount: Math.round(amt * 100).toString(),
        currency: "INR",
        name: "Samarpan",
        description: "Donation",
        order_id: orderData.orderId,
        prefill: { name, email, contact: phone },
        notes: { message },
        theme: { color: "#16a34a" },
        handler: async (resp: any) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                donor: { name, email, phone, message, amount: amt },
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.success) {
              setSuccess("Thank you for your donation!")
              setAmount("")
              setMessage("")
            } else {
              setError(verifyData.error || "Payment verification failed")
            }
          } catch (e: any) {
            setError(e.message || "Verification error")
          } finally {
            setIsProcessing(false)
          }
        },
      }

      const rzp = new (window as any).Razorpay(opts)
      rzp.on("payment.failed", (resp: any) => {
        setError(resp.error?.description || "Payment failed")
        setIsProcessing(false)
      })
      rzp.open()
    } catch (e: any) {
      setError(e.message || "Payment initialization failed")
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Support Samarpan
            </CardTitle>
            <CardDescription>Your contribution helps us continue our mission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{success}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (INR)</label>
              <Input
                placeholder="e.g., 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min={1}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea placeholder="Leave a message" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button onClick={startPayment} disabled={isProcessing} className="gap-2">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                {isProcessing ? "Processing..." : "Donate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
