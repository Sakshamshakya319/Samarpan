import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart, Users, Zap, ArrowRight, MapPin, Activity, Shield } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import { BlogCarousel } from "@/components/features/blog-carousel"
import { NGOOnboardingBanner } from "@/components/ngo/ngo-onboarding-banner"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Save Lives, Make a Difference
              </span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-balance">
              Connect Donors,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Save Lives</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Samarpan is a real-time blood infrastructure platform — city-wise emergency matching,
              smart donor prioritization, and hospital integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Emergency SOS — most prominent */}
              <Link href="/sos">
                <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 animate-pulse">
                  🚨 Emergency SOS <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Become a Donor <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
            {/* City Dashboard quick link */}
            <div className="mt-6">
              <Link
                href="/city-dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                View live blood shortage map →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Donation Carousel Section */}
      {/* <section className="py-20 md:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold mb-4">Our Impact in Blood Donation</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From donors to patients, see how Samarpan is making a difference in saving lives across the community.
            </p>
          </div>

          <div className="relative px-12">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
            >
              <CarouselContent>
                {[
                  {
                    src: "/blood-donation/donation-1.svg",
                    alt: "Save Lives Through Donation",
                  },
                  {
                    src: "/blood-donation/donation-2.svg",
                    alt: "Blood Bank & Storage",
                  },
                  {
                    src: "/blood-donation/donation-3.svg",
                    alt: "Hospital & Emergency Care",
                  },
                  {
                    src: "/blood-donation/donation-4.svg",
                    alt: "Join Our Community",
                  },
                ].map((item, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-2/3">
                    <div className="flex justify-center">
                      <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border shadow-lg">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          fill
                          className="object-contain bg-white"
                          priority={index === 0}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 hover:bg-primary/80 hover:text-white" />
              <CarouselNext className="right-0 hover:bg-primary/80 hover:text-white" />
            </Carousel>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">Blood Infrastructure Platform</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Samarpan 2.0 — not just a donor finder. A complete emergency response system for India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Emergency SOS",
                description: "One-tap blood request in under 60 seconds. No login required. Voice, document scan, or manual input.",
                badge: "🚨 Phase 1",
                href: "/sos",
              },
              {
                icon: MapPin,
                title: "City-Wise Matching",
                description: "Donors matched by proximity. Radius expands 5km → 15km → 30km → city as time passes.",
                badge: "📍 Phase 2",
                href: "/city-dashboard",
              },
              {
                icon: Shield,
                title: "Verified Requests",
                description: "Every request carries a trust badge: 🟢 Verified, 🟡 Partial, 🔴 Pending — donors know before they respond.",
                badge: "✅ Trust",
                href: "/request-blood",
              },
              {
                icon: Heart,
                title: "Care Circle",
                description: "Save recurring patient profiles for cancer, thalassemia, and sickle cell patients. Re-raise emergencies in one tap.",
                badge: "💗 Phase 4",
                href: "/care-circle",
              },
              {
                icon: Users,
                title: "Smart Donor Scoring",
                description: "Rule-based scoring: distance × eligibility × response history. Fatigue-aware — donors never get spammed.",
                badge: "🧠 Phase 3",
                href: "/donate-blood",
              },
              {
                icon: Activity,
                title: "Impact Metrics",
                description: "Track avg response time, match rate, and SOS resolution. After 500 requests: AI behavioral scoring.",
                badge: "📊 Phase 5",
                href: "/impact",
              },
            ].map((feature, index) => (
              <a
                key={index}
                href={feature.href}
                className="p-8 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <feature.icon className="w-10 h-10 text-primary" />
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Preview Section */}
      <section className="py-16 bg-gradient-to-br from-red-50 via-background to-background border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            Building India&apos;s Emergency Blood Network
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            City by city. Starting with Jalandhar, and Chandigarh.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Response Target", value: "≤ 12 min" },
              { label: "Match Rate Goal", value: "≥ 85%" },
              { label: "SOS Resolution", value: "≤ 30 min" },
              { label: "Search Reduction", value: "−60%" },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-white border shadow-sm">
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
          <Link href="/impact">
            <Button variant="outline" className="gap-2">
              <Activity className="w-4 h-4" />
              View Live Impact Metrics
            </Button>
          </Link>
        </div>
      </section>

      {/* Blog Carousel Section */}
      <BlogCarousel />

      {/* NGO Onboarding Section */}
      <NGOOnboardingBanner />

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary/5 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join our community of donors and help save lives today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sos">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white gap-2">
                🚨 Emergency SOS
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg">Become a Donor</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
