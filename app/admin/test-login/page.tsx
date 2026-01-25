"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminTestLogin() {
  const [email, setEmail] = useState("admin@samarpan.com")
  const [password, setPassword] = useState("admin123")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult("")

    try {
      console.log('🧪 Testing admin login...')
      console.log('📧 Email:', email)
      console.log('🔑 Password:', password)

      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('📦 Response data:', data)

      if (response.ok) {
        setResult(`✅ SUCCESS!\n\nToken: ${data.token}\n\nAdmin: ${JSON.stringify(data.admin, null, 2)}`)
      } else {
        setResult(`❌ FAILED!\n\nStatus: ${response.status}\nError: ${data.error}`)
      }
    } catch (error) {
      console.error('🚨 Test error:', error)
      setResult(`🚨 NETWORK ERROR!\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">🧪 Admin Login Test</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@samarpan.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
              />
            </div>

            <Button 
              onClick={testLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "🧪 Test Login"}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Test Result</h2>
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </AlertDescription>
            </Alert>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">ℹ️ Test Info</h2>
          <div className="text-sm space-y-2">
            <p><strong>Default Credentials:</strong></p>
            <p>📧 Email: admin@samarpan.com</p>
            <p>🔑 Password: admin123</p>
            <p><strong>API Endpoint:</strong> /api/auth/admin-login</p>
            <p><strong>Check Console:</strong> Open browser dev tools for detailed logs</p>
          </div>
        </Card>
      </div>
    </div>
  )
}