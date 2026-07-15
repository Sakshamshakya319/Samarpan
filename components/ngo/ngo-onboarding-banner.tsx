"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Users, Heart, ArrowRight, CheckCircle, FileText, Shield, Award } from "lucide-react"
import Link from "next/link"

export function NGOOnboardingBanner() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Banner */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 mb-4">
              Partner with Samarpan as an NGO
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our network of verified NGOs and amplify your blood donation impact. 
              Organize camps, manage donors, and save more lives together.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Donor Network</h3>
                <p className="text-gray-600 text-sm">Access thousands of verified donors across India</p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Camp Management</h3>
                <p className="text-gray-600 text-sm">Organize and manage blood donation camps efficiently</p>
              </div>
              
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Verified Status</h3>
                <p className="text-gray-600 text-sm">Get verified NGO badge and build donor trust</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/ngo/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  Register Your NGO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-8 py-3 text-lg"
              >
                Learn More
              </Button>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="mt-8 space-y-8 border-t pt-8">
                
                {/* Requirements */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    <Shield className="w-6 h-6 inline mr-2" />
                    Registration Requirements
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Mandatory Documents */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Mandatory Documents
                      </h4>
                      <ul className="space-y-2 text-sm text-red-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          NGO Registration Certificate (Trust/Society/Section 8)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          Blood Bank/Donation License (if applicable)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          PAN Card of NGO
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          Address Proof (Electricity/Water bill)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          ID Proof of Authorized Person
                        </li>
                      </ul>
                    </div>

                    {/* Optional Documents */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Recommended Documents
                      </h4>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          80G Certificate (for donations)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          12A Certificate (for donations)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          Website/Social Media Links
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          Google Maps Location
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Process Steps */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Registration Process
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        1
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Submit Application</h4>
                      <p className="text-gray-600 text-sm">Fill the registration form and upload documents</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        2
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Admin Review</h4>
                      <p className="text-gray-600 text-sm">Our team reviews your application (3-5 days)</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        3
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Get Approved</h4>
                      <p className="text-gray-600 text-sm">Receive approval email with login credentials</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        4
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Start Managing</h4>
                      <p className="text-gray-600 text-sm">Login and start organizing blood donation activities</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    What You Get
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-2">🏥 Camp Organization</h4>
                      <p className="text-gray-600 text-sm">Plan and manage blood donation camps with ease</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-2">👥 Donor Management</h4>
                      <p className="text-gray-600 text-sm">Track and communicate with registered donors</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-2">📊 Analytics Dashboard</h4>
                      <p className="text-gray-600 text-sm">Monitor your impact with detailed reports</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-2">🏆 Verified Badge</h4>
                      <p className="text-gray-600 text-sm">Display verified NGO status to build trust</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-2">📱 Mobile Access</h4>
                      <p className="text-gray-600 text-sm">Manage activities on-the-go with mobile app</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h4 className="font-semibold text-gray-900 mb-2">🤝 Network Support</h4>
                      <p className="text-gray-600 text-sm">Connect with other NGOs and blood banks</p>
                    </div>
                  </div>
                </div>

                {/* Final CTA */}
                <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
                  <h3 className="text-2xl font-bold mb-4">Ready to Make a Bigger Impact?</h3>
                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Join hundreds of NGOs already using Samarpan to organize successful blood donation drives and save lives across India.
                  </p>
                  <Link href="/ngo/register">
                    <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                      Start Registration Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}