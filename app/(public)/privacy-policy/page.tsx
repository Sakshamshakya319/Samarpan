import { Card } from "@/components/ui/card"

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your personal information.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">1. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We collect information you provide directly to us, such as when you create an account, donate blood,
                  request blood, or contact us for support.
                </p>
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name, email address, and phone number</li>
                  <li>Blood type and medical history (for donors)</li>
                  <li>Location information for matching donors and recipients</li>
                  <li>Communication preferences</li>
                </ul>
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and features used</li>
                  <li>Donation and request history</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">2. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Connect blood donors with recipients in need</li>
                  <li>Process and manage blood donation requests</li>
                  <li>Send important notifications about donation opportunities</li>
                  <li>Improve our platform and develop new features</li>
                  <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal obligations and regulations</li>
                  <li>Provide customer support and respond to inquiries</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">3. Information Sharing and Disclosure</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell, trade, or rent your personal information to third parties. We may share your
                  information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With blood recipients (with your consent) to facilitate life-saving donations</li>
                  <li>With healthcare providers involved in blood donation processes</li>
                  <li>When required by law or to protect our rights</li>
                  <li>With service providers who help us operate our platform</li>
                  <li>In connection with a business transfer or merger</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">4. Data Security</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information
                  against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data storage and backup systems</li>
                  <li>Employee training on data protection</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">5. Your Rights and Choices</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us using the information provided in our Contact section.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">6. Cookies and Tracking Technologies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use cookies and similar technologies to enhance your experience on our platform. For detailed
                  information about our cookie practices, please see our Cookie Policy.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">7. Children's Privacy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our platform is not intended for children under 18 years of age. We do not knowingly collect personal
                  information from children under 18. If we become aware that we have collected personal information
                  from a child under 18, we will take steps to delete such information.
                </p>
              </div>
            </Card>

            <Card className="p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">8. Changes to This Privacy Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our practices or for other
                  operational, legal, or regulatory reasons. We will notify you of any material changes by posting the
                  updated policy on our website and updating the "Last Updated" date.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-6">9. Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
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