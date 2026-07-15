"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function QRDebugScanner() {
  const [token, setToken] = useState("7JTQJJ")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const testQRVerification = async () => {
    setLoading(true)
    setResult("")

    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken")
      
      console.log('🔐 Admin token from localStorage:', adminToken ? 'Present' : 'Missing')
      console.log('🧪 Testing token:', token)

      if (!adminToken) {
        setResult("❌ No admin token found in localStorage. Please login first.")
        return
      }

      // Test GET request first
      console.log('🔍 Testing GET request...')
      const getResponse = await fetch(`/api/event-registrations/qr-verify?alphanumericToken=${token}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log('📡 GET Response status:', getResponse.status)
      const getData = await getResponse.json()
      console.log('📦 GET Response data:', getData)

      if (!getResponse.ok) {
        setResult(`❌ GET FAILED!\n\nStatus: ${getResponse.status}\nError: ${getData.error || 'Unknown error'}\n\nResponse: ${JSON.stringify(getData, null, 2)}`)
        return
      }

      // Test POST request
      console.log('✅ Testing POST request...')
      const postResponse = await fetch("/api/event-registrations/qr-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          alphanumericToken: token,
        }),
      })

      console.log('📡 POST Response status:', postResponse.status)
      const postData = await postResponse.json()
      console.log('📦 POST Response data:', postData)

      if (postResponse.ok) {
        setResult(`✅ SUCCESS!\n\nGET Response:\n${JSON.stringify(getData, null, 2)}\n\nPOST Response:\n${JSON.stringify(postData, null, 2)}`)
      } else {
        setResult(`❌ POST FAILED!\n\nStatus: ${postResponse.status}\nError: ${postData.error || 'Unknown error'}\n\nResponse: ${JSON.stringify(postData, null, 2)}`)
      }
    } catch (error) {
      console.error('🚨 Test error:', error)
      setResult(`🚨 NETWORK ERROR!\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkLocalStorage = () => {
    const adminToken = localStorage.getItem("adminToken")
    const adminEmail = localStorage.getItem("adminEmail")
    const adminRole = localStorage.getItem("adminRole")
    
    setResult(`📋 LocalStorage Contents:\n\nAdmin Token: ${adminToken ? 'Present ✅' : 'Missing ❌'}\nAdmin Email: ${adminEmail || 'Missing'}\nAdmin Role: ${adminRole || 'Missing'}\n\nToken Preview: ${adminToken ? adminToken.substring(0, 50) + '...' : 'N/A'}`)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">🐛 QR Debug Scanner</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Token</label>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="Enter token to test (e.g., 7JTQJJ)"
            maxLength={6}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testQRVerification}
            disabled={loading || !token.trim()}
            className="flex-1"
          >
            {loading ? "Testing..." : "🧪 Test QR Verification"}
          </Button>
          
          <Button
            onClick={checkLocalStorage}
            variant="outline"
          >
            📋 Check LocalStorage
          </Button>
        </div>
      </div>

      {result && (
        <Card className="p-4">
          <h4 className="text-md font-semibold mb-2">📋 Test Result</h4>
          <Alert>
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </AlertDescription>
          </Alert>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="text-md font-semibold mb-2">ℹ️ Debug Info</h4>
        <div className="text-sm space-y-1">
          <p><strong>Available Test Tokens:</strong></p>
          <p>• 7JTQJJ (Pending - should work)</p>
          <p>• QHRZ0F (Completed - should fail)</p>
          <p>• ES1MSE (Volunteer token)</p>
          <p><strong>API Endpoints:</strong></p>
          <p>• GET: /api/event-registrations/qr-verify</p>
          <p>• POST: /api/event-registrations/qr-verify</p>
        </div>
      </Card>
    </div>
  )
}