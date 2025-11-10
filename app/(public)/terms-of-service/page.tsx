import { Card } from "@/components/ui/card"

export default function TermsOfService() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully. By using Samarpan, you agree to the following terms and conditions.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By accessing or using Samarpan (the Platform), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">2. Eligibility</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You must be at least 18 years of age to use the Platform. By using the Platform, you represent and warrant that you meet this eligibility requirement.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">3. User Accounts</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">4. Donations and Requests</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The Platform facilitates connecting donors with recipients. We do not guarantee the availability of donors or the suitability of donations. All medical decisions should be made with qualified healthcare professionals.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">5. Prohibited Conduct</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Engaging in fraudulent, misleading, or unlawful activities</li>
                  <li>Harassing, threatening, or harming other users</li>
                  <li>Uploading or sharing content that is illegal, harmful, or infringing</li>
                  <li>Attempting to gain unauthorized access to the Platform or other accounts</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">6. Content Ownership</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You retain ownership of content you submit to the Platform. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display the content solely for the purpose of operating and improving the Platform.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">7. Privacy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your use of the Platform is also governed by our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>. Please review it to understand how we collect, use, and protect your information.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">8. Cookies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use cookies and similar technologies. Learn more in our <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">9. Limitation of Liability</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  To the maximum extent permitted by law, Samarpan shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">10. Indemnification</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You agree to indemnify and hold harmless Samarpan and its affiliates from any claims, liabilities, damages, losses, and expenses arising from your use of the Platform.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">11. Termination</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may suspend or terminate your access to the Platform at any time if you violate these Terms or engage in harmful behavior.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">12. Governing Law</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts located in Jalandhar, India.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">13. Changes to Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update these Terms from time to time. Continued use of the Platform after revisions constitutes acceptance of the updated Terms.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-6">14. Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>If you have questions about these Terms, contact us:</p>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p><strong>Email:</strong> legal@samarpan.com</p>
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