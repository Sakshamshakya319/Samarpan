"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Users, Heart, Award, ArrowRight, CheckCircle, Shield } from "lucide-react"
import Link from "next/link"

export function NGOOnboardingBanner() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="bg-slate-50 py-24 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main Banner */}
        <h2 className="font-heading text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Partner with Samarpan as an NGO
        </h2>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Join our network of verified NGOs to amplify your blood donation impact. Organize camps, manage donors, and save more lives.
        </p>
        
        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6 text-slate-700">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">Donor Network</h3>
            <p className="text-slate-500 leading-relaxed">Access thousands of verified donors across your city and state.</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6 text-slate-700">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">Camp Management</h3>
            <p className="text-slate-500 leading-relaxed">Organize, track, and manage blood donation camps efficiently.</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6 text-slate-700">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">Verified Status</h3>
            <p className="text-slate-500 leading-relaxed">Earn a verified NGO badge to instantly build donor trust.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/ngo/register">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all">
              Register Your NGO
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-14 px-8 text-lg font-medium border-slate-200 hover:bg-slate-100 text-slate-700"
          >
            Learn More
          </Button>
        </div>

        {/* Expandable Details (Minimalist) */}
        {isExpanded && (
          <div className="mt-16 pt-12 border-t border-slate-200 text-left">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-slate-700" />
              Registration Requirements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Mandatory Documents */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-6 text-lg">Mandatory Documents</h4>
                <ul className="space-y-4 text-slate-600">
                  {[
                    "NGO Registration Certificate",
                    "Blood Bank/Donation License (if applicable)",
                    "PAN Card of NGO",
                    "Address Proof (Electricity/Water bill)",
                    "ID Proof of Authorized Person"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Documents */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-6 text-lg">Recommended Documents</h4>
                <ul className="space-y-4 text-slate-600">
                  {[
                    "80G Certificate (for donations)",
                    "12A Certificate (for donations)",
                    "Website/Social Media Links",
                    "Google Maps Location"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/ngo/register" className="inline-flex items-center text-red-600 hover:text-red-700 font-semibold transition-colors">
                Proceed to Registration <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}