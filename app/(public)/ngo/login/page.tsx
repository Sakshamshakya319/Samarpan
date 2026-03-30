"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function NGOLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ngo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Login successful! Redirecting to dashboard...')
        
        // Store token and NGO data
        localStorage.setItem('ngoToken', data.token)
        localStorage.setItem('ngoData', JSON.stringify(data.ngo))
        
        // Redirect to NGO dashboard
        setTimeout(() => {
          router.push('/ngo/dashboard')
        }, 1500)
      } else {
        // Handle pause status specifically
        if (data.isPaused) {
          // Store pause information for the dashboard
          localStorage.setItem('ngoPauseInfo', JSON.stringify({
            reason: data.pauseReason,
            pausedAt: data.pausedAt
          }))
          setError(`Your NGO account has been temporarily suspended. ${data.pauseReason ? `Reason: ${data.pauseReason}` : 'Please contact support for more information.'}`)
        } else {
          setError(data.error || 'Login failed')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">NGO Login</h1>
          <p className="text-gray-600">Access your NGO dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-gray-900">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your blood donation activities</CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NGO Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your NGO email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't have an NGO account?{' '}
                <Link href="/ngo/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Register here
                </Link>
              </p>
              
              <p className="text-sm text-gray-600">
                <Link 
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot your password?
                </Link>
              </p>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  For regular user login,{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    click here
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Status Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Application Under Review?</h3>
              <p className="text-yellow-700 text-sm mt-1">
                If your NGO application is still under review, you'll receive an email once it's approved. 
                Only approved NGOs can access the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}