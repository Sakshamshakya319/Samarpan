import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CookiePolicy() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Cookie Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn about how we use cookies and similar technologies to improve your experience on our platform.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">What Are Cookies?</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Cookies are small text files that are stored on your device when you visit our website. They help us
                  provide you with a better browsing experience by remembering your preferences and understanding how
                  you use our platform.
                </p>
                <p>
                  We also use similar technologies like web beacons, pixels, and local storage to collect information
                  about your interactions with our platform.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Types of Cookies We Use</h2>
              <div className="space-y-6 text-muted-foreground">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Essential Cookies</h3>
                  <p className="mb-2">
                    These cookies are necessary for the website to function properly. They enable core functionality
                    such as security, network management, and accessibility.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Authentication and security cookies</li>
                    <li>Session management cookies</li>
                    <li>Load balancing cookies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Functional Cookies</h3>
                  <p className="mb-2">
                    These cookies enhance your experience by remembering your preferences and settings.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Language preferences</li>
                    <li>Location settings</li>
                    <li>Theme preferences (light/dark mode)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Analytics Cookies</h3>
                  <p className="mb-2">
                    These cookies help us understand how visitors interact with our website by collecting and reporting
                    information anonymously.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Page view statistics</li>
                    <li>User journey tracking</li>
                    <li>Feature usage analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Marketing Cookies</h3>
                  <p className="mb-2">
                    These cookies are used to deliver relevant advertisements and track the effectiveness of our
                    marketing campaigns.
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Social media advertising</li>
                    <li>Retargeting campaigns</li>
                    <li>Conversion tracking</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Third-Party Cookies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may use third-party services that place cookies on your device. These services help us provide
                  additional functionality and improve our platform:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                  <li><strong>Social Media Platforms:</strong> For social sharing and login functionality</li>
                  <li><strong>Payment Processors:</strong> For secure payment processing</li>
                  <li><strong>Customer Support:</strong> For live chat and support ticket systems</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Managing Your Cookie Preferences</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You have several options for managing cookies:</p>

                <div className="bg-secondary/50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Browser Settings</h3>
                  <p>
                    Most web browsers allow you to control cookies through their settings. You can usually find these
                    options in the 'Options' or 'Preferences' menu of your browser.
                  </p>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Cookie Consent Banner</h3>
                  <p>
                    When you first visit our website, you'll see a cookie consent banner where you can choose which
                    types of cookies to accept or reject.
                  </p>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Opt-Out Links</h3>
                  <p>
                    For specific third-party services, you can opt-out directly through their websites:
                  </p>
                  <ul className="list-disc pl-6 mt-2">
                    <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline">Google Analytics Opt-out</a></li>
                    <li><a href="https://www.facebook.com/ads/preferences" className="text-primary hover:underline">Facebook Advertising Preferences</a></li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Impact of Disabling Cookies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Please note that disabling certain cookies may affect your experience on our platform:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Essential cookies cannot be disabled as they are required for basic functionality</li>
                  <li>Disabling functional cookies may result in loss of personalized features</li>
                  <li>Analytics cookies help us improve our service, but the platform will still work without them</li>
                  <li>Marketing cookies are optional and disabling them won't affect core platform functionality</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Updates to This Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or applicable
                  laws. We will notify you of any significant changes by updating the "Last Updated" date at the bottom
                  of this page.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p><strong>Email:</strong> privacy@samarpan.com</p>
                  <p><strong>Phone:</strong> +91 98765 43210</p>
                  <p><strong>Address:</strong> Jalandhar, India</p>
                </div>
              </div>
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