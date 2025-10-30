import { Card } from "@/components/ui/card"

export default function About() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About Samarpan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our mission is to connect donors and patients to save lives through blood and platelet donations.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To create a seamless connection between blood and platelet donors and patients in need, ensuring that no
                one suffers due to lack of available blood or platelets. We believe in the power of community and the
                impact of voluntary donations.
              </p>
            </Card>
            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To build a world where blood and platelet donations are easily accessible, where donors are recognized
                and appreciated, and where every patient in need can find help within minutes. We envision a society
                where giving blood is a norm and saving lives is everyone's responsibility.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Compassion",
                description: "We care deeply about the wellbeing of both donors and patients.",
              },
              {
                title: "Transparency",
                description: "We maintain complete transparency in all our operations and communications.",
              },
              {
                title: "Innovation",
                description: "We continuously innovate to improve our platform and services.",
              },
              {
                title: "Community",
                description: "We believe in the power of community and collective action.",
              },
              {
                title: "Reliability",
                description: "We are committed to being a reliable partner in times of need.",
              },
              {
                title: "Accessibility",
                description: "We make our services accessible to everyone, regardless of background.",
              },
            ].map((value, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {/* <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Team</h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Our dedicated team is committed to making a difference in the lives of donors and patients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              // { name: "", role: "Founder & CEO" }
              // { name: "Priya Singh", role: "Medical Director" },
              // { name: "Amit Patel", role: "Technology Lead" },
            ].map((member, index) => (
              <Card key={index} className="p-8 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section> */}
    </main>
  )
}
