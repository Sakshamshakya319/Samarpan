"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Mail, Phone, MapPin, Send, CheckCircle, MessageSquare, Loader2 } from "lucide-react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit form")
      }

      setSubmitted(true)
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to submit contact form. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white py-16 md:py-24 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <MessageSquare className="w-3.5 h-3.5" /> Support
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Have questions about blood donation or need support? We're here to help. Send us a message and our team will respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Email Us</h3>
              <p className="text-sm text-slate-500 mb-4">Send us an email anytime.</p>
              <a href="mailto:astermindsofficial@gmail.com" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                astermindsofficial@gmail.com
              </a>
            </Card>

            <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Phone className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Call Us</h3>
              <p className="text-sm text-slate-500 mb-4">Available 24/7 for emergencies.</p>
              <a href="tel:+919876543210" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                +91 98765 43210
              </a>
            </Card>

            <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Visit Us</h3>
              <p className="text-sm text-slate-500 mb-4">Come see us in person.</p>
              <p className="text-sm font-semibold text-slate-900">Jalandhar, India</p>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 md:p-12 bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Send a Message</h2>
                <p className="text-slate-500 text-sm">Fill out the form below and we'll get back to you shortly.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></div>
                    {error}
                  </div>
                )}
                {submitted && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Thank you! Your message has been sent successfully.
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Subject</label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide details about your inquiry..."
                    rows={6}
                    className="bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-900 resize-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto h-12 px-8 font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
