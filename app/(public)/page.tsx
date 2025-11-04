import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart, Users, Zap, ArrowRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import { BlogCarousel } from "@/components/blog-carousel"

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
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Connect Donors,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Save Lives</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Samarpan is a real-time blood and platelet donor connection platform that brings donors and patients
              together to save lives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Donation Carousel Section */}
      {/* <section className="py-20 md:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Impact in Blood Donation</h2>
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
            <h2 className="text-4xl font-bold mb-4">Why Choose Samarpan?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make it easy to find donors and save lives with our innovative platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Real-Time Connection",
                description: "Connect with donors instantly when you need blood or platelets.",
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Join thousands of donors and patients making a difference.",
              },
              {
                icon: Zap,
                title: "Fast & Reliable",
                description: "Quick verification and reliable donor information.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-lg border border-border bg-card hover:border-primary/50 transition"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Carousel Section */}
      <BlogCarousel />

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary/5 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join our community of donors and help save lives today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
