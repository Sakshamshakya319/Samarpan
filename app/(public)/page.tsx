import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Shield, Zap, MapPin } from "lucide-react"
import { BlogCarousel } from "@/components/features/blog-carousel"
import { NGOOnboardingBanner } from "@/components/ngo/ngo-onboarding-banner"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 md:py-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900">
            Connect Donors, <br />
            <span className="text-red-600">Save Lives.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Samarpan is a real-time blood infrastructure platform offering city-wise emergency matching, verified requests, and intelligent donor prioritization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/sos">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all">
                🚨 Emergency SOS
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-slate-200 hover:bg-slate-50 text-slate-700">
                Become a Donor
              </Button>
            </Link>
          </div>
          <div className="mt-8">
            <Link
              href="/city-dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              View live blood shortage map &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Zap,
                title: "Emergency SOS",
                description: "One-tap blood request in under 60 seconds. Real-time alerts for urgent blood needs.",
              },
              {
                icon: Shield,
                title: "Verified Requests",
                description: "Every request is verified for authenticity so donors know before they respond.",
              },
              {
                icon: Heart,
                title: "Smart Matching",
                description: "Intelligent matching based on proximity, blood group, and response history.",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6 text-red-600">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Carousel Section */}
      <BlogCarousel />

      {/* NGO Onboarding Section */}
      <NGOOnboardingBanner />
    </main>
  )
}
