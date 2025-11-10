"use client"

import { Card } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function FAQPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Quick answers to common questions about donations, requests, and using Samarpan.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            <Card className="p-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I register as a donor?</AccordionTrigger>
                  <AccordionContent>
                    Create an account and complete your donor profile with accurate blood type, location, and contact details. You can then opt-in to receive donation requests.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Is my personal information safe?</AccordionTrigger>
                  <AccordionContent>
                    We take privacy seriously. Read our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> for details on how we protect your data.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>How are donors matched with recipients?</AccordionTrigger>
                  <AccordionContent>
                    We match donors based on blood type, proximity, and availability. Medical suitability is always confirmed by healthcare professionals.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I request blood or platelets?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Provide your requirement and hospital details. We notify nearby donors who can respond to your request.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Do you charge any fees?</AccordionTrigger>
                  <AccordionContent>
                    No. Samarpan is a community platform connecting donors and recipients without charging users.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>What if I can’t donate after accepting?</AccordionTrigger>
                  <AccordionContent>
                    Please update your status promptly so other donors can be notified. We understand emergencies and availability changes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Do you use cookies?</AccordionTrigger>
                  <AccordionContent>
                    Yes, to improve your experience. See our <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a> for details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>How do I contact support?</AccordionTrigger>
                  <AccordionContent>
                    Email us at support@samarpan.com or use the Contact page. We aim to respond quickly.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Last Updated: November 10, 2025</p>
          </div>
        </div>
      </section>
    </main>
  )
}