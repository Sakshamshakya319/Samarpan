"use client"

import { Card } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { HelpCircle, Search, MessageCircle } from "lucide-react"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/3 to-accent/3 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6 animate-fade-in">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent animate-fade-in-up">
            Frequently Asked Questions
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Quick answers to common questions about 
            <span className="text-primary font-medium"> donations, requests, and using Samarpan</span>. 
            Can't find what you're looking for? We're here to help.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Search className="w-4 h-4" />
              Most Asked Questions
            </div>
            <h2 className="font-heading text-3xl font-bold mb-4">Everything You Need to Know</h2>
            <p className="text-muted-foreground">Browse through our comprehensive FAQ section</p>
          </div>

          <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="p-8 md:p-12">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    How do I register as a donor?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    Create an account and complete your donor profile with accurate blood type, location, and contact details. You can then opt-in to receive donation requests and help save lives in your community.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    Is my personal information safe?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    We take privacy seriously and use industry-standard security measures to protect your data. Read our <a href="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</a> for detailed information on how we collect, use, and protect your personal information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    How are donors matched with recipients?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    We match donors based on blood type compatibility, geographical proximity, and availability. Our system prioritizes urgent requests and ensures medical suitability is always confirmed by qualified healthcare professionals.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    Can I request blood or platelets for someone?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    Yes, you can submit requests for blood or platelets. Simply provide the patient's requirements, hospital details, and urgency level. We'll immediately notify nearby compatible donors who can respond to your request.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    Do you charge any fees for using Samarpan?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    No, Samarpan is completely free to use. We're a community-driven platform focused on connecting donors and recipients without any charges. Our mission is to save lives, not make profits.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    What if I can't donate after accepting a request?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    Please update your status in the app as soon as possible so other donors can be notified. We understand that emergencies and availability can change, and there's no penalty for canceling when necessary.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    Do you use cookies on your website?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    Yes, we use cookies to improve your browsing experience and provide personalized features. See our <a href="/cookie-policy" className="text-primary hover:underline font-medium">Cookie Policy</a> for detailed information about the types of cookies we use.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border border-border/50 rounded-xl px-6 py-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    How do I contact support if I need help?
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                    You can reach us at astermindsofficial@gmail.com or use our <a href="/contact" className="text-primary hover:underline font-medium">Contact page</a>. We aim to respond to all inquiries within 24 hours and provide comprehensive support.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </Card>

          {/* Still have questions section */}
          <div className="mt-16 text-center">
            <Card className="p-8 border-0 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
                <h3 className="font-heading text-xl font-semibold">Still have questions?</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Can't find the answer you're looking for? Our support team is here to help you.
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </a>
            </Card>
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Last Updated: January 24, 2025</p>
          </div>
        </div>
      </section>
    </main>
  )
}