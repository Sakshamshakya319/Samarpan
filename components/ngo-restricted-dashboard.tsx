"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShieldAlert, 
  Mail, 
  Phone, 
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  Heart,
  Settings,
  FileText,
  Bell,
  Lock,
  Unlock
} from "lucide-react"

interface NGORestrictedDashboardProps {
  ngoName: string
  pauseReason?: string
  pausedAt?: string
  contactEmail?: string
  onRefresh?: () => Promise<void>
}

export function NGORestrictedDashboard({ 
  ngoName, 
  pauseReason, 
  pausedAt,
  contactEmail = "support@samarpan.com",
  onRefresh
}: NGORestrictedDashboardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShieldAlert className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Account Temporarily Suspended</h1>
          <p className="text-xl text-gray-600 mb-2">
            {ngoName}
          </p>
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
            <Lock className="w-4 h-4" />
            Restricted Access Mode
          </div>
        </div>

        {/* Main Alert Card */}
        <Card className="border-l-4 border-orange-500 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-3 text-orange-800 text-xl">
              <AlertTriangle className="w-7 h-7" />
              Important: Your NGO Account Has Been Temporarily Suspended
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Suspension Details */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-orange-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Suspension Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 font-medium">Status:</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Temporarily Suspended
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span className="text-gray-900 font-medium">{formatDate(pausedAt)}</span>
                    </div>
                    {pauseReason && (
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-gray-600 font-medium block mb-2">Reason:</span>
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <p className="text-red-800 text-sm leading-relaxed">{pauseReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* What This Means */}
                <div className="bg-white p-6 rounded-lg border border-orange-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    What This Means
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <Lock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-orange-900">Restricted Access</p>
                        <p className="text-orange-700">You can log in but cannot perform NGO operations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-900">Temporary Measure</p>
                        <p className="text-yellow-700">This is not permanent - under administrative review</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900">Email Notifications</p>
                        <p className="text-blue-700">You'll be notified when suspension is lifted</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Permissions */}
              <div className="space-y-6">
                
                {/* What You CAN'T Do */}
                <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm">
                  <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Restricted Functions
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: Calendar, text: "Organize or manage blood donation camps" },
                      { icon: Users, text: "Register or manage donors" },
                      { icon: Heart, text: "Accept or respond to blood requests" },
                      { icon: FileText, text: "Create or update NGO content" },
                      { icon: Settings, text: "Modify NGO profile or settings" },
                      { icon: Bell, text: "Send notifications to users" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <item.icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-700 text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What You CAN Do */}
                <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Available Functions
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Log in and access your dashboard",
                      "View your NGO profile information",
                      "Contact support team for assistance",
                      "Check account status and updates",
                      "Review suspension details and reason",
                      "Prepare documentation if needed"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-green-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Contact Support Card */}
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <Mail className="w-6 h-6" />
                Need Help? Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If you believe this suspension is in error or need clarification about the reason, 
                  our support team is here to help. We're committed to resolving issues quickly and fairly.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">When contacting support, please include:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your NGO name: <strong>{ngoName}</strong></li>
                    <li>• Suspension date: <strong>{formatDate(pausedAt)}</strong></li>
                    <li>• Any relevant documentation or clarification</li>
                    <li>• Your contact information for follow-up</li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="gap-2 flex-1">
                    <a href={`mailto:${contactEmail}?subject=NGO Account Suspension Appeal - ${ngoName}&body=Hello Samarpan Support Team,%0D%0A%0D%0AI am writing regarding the suspension of my NGO account "${ngoName}".%0D%0A%0D%0ASuspension Details:%0D%0A- NGO Name: ${ngoName}%0D%0A- Suspension Date: ${formatDate(pausedAt)}%0D%0A- Reason: ${pauseReason || 'Not specified'}%0D%0A%0D%0AI would like to:%0D%0A☐ Appeal this suspension%0D%0A☐ Request clarification on the reason%0D%0A☐ Provide additional documentation%0D%0A☐ Schedule a call to discuss%0D%0A%0D%0AAdditional Information:%0D%0A[Please provide any relevant details or documentation]%0D%0A%0D%0AThank you for your time and consideration.%0D%0A%0D%0ABest regards,%0D%0A[Your Name]%0D%0A[Your Position]%0D%0A${ngoName}`}>
                      <Mail className="w-4 h-4" />
                      Email Support
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild className="gap-2">
                    <a href="tel:+911234567890">
                      <Phone className="w-4 h-4" />
                      Call Support
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Check Card */}
          <Card className="shadow-lg border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-3 text-green-800">
                <Unlock className="w-6 h-6" />
                Check Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Once your account is reviewed and the suspension is lifted, you'll receive an email 
                  notification and can immediately resume all NGO operations.
                </p>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">When your account is restored:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• ✅ You'll receive an email confirmation</li>
                    <li>• ✅ All NGO functions will be immediately available</li>
                    <li>• ✅ You can organize blood donation camps</li>
                    <li>• ✅ Full access to donor management</li>
                    <li>• ✅ Ability to respond to blood requests</li>
                  </ul>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    onClick={onRefresh || (() => window.location.reload())}
                    className="gap-2 w-full"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {onRefresh ? 'Check Status Now' : 'Refresh Page to Check Status'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.removeItem('ngoToken')
                      localStorage.removeItem('ngoData')
                      localStorage.removeItem('ngoPauseInfo')
                      window.location.href = '/ngo/login'
                    }}
                    className="gap-2 w-full"
                  >
                    <Unlock className="w-4 h-4" />
                    Log Out & Log In Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resolution Process */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-800">
              <FileText className="w-6 h-6" />
              Resolution Process
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Review Process</h3>
                <p className="text-gray-600 text-sm">
                  Our team reviews your account and the suspension reason to ensure fair treatment.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Communication</h3>
                <p className="text-gray-600 text-sm">
                  We may contact you for additional information or clarification during the review.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Resolution</h3>
                <p className="text-gray-600 text-sm">
                  Once resolved, your account will be restored and you'll receive email confirmation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-2">
              <strong>Remember:</strong> This suspension is temporary and part of our commitment to maintaining 
              a safe and trustworthy platform for all blood donation activities.
            </p>
            <p className="text-gray-500 text-sm">
              We appreciate your patience and understanding as we work to resolve this matter quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}