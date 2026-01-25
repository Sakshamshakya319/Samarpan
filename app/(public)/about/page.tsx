import { Card } from "@/components/ui/card"
import { Heart, Users, Shield, Zap, Globe, Award } from "lucide-react"

export default function About() {
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
            <Heart className="w-4 h-4" />
            Saving Lives Together
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent animate-fade-in-up">
            About Samarpan
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Our mission is to connect donors and patients to save lives through 
            <span className="text-primary font-medium"> blood and platelet donations</span>. 
            We're building a community where every drop counts and every life matters.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Card className="group p-10 border-0 bg-gradient-to-br from-blue-50/50 to-blue-100/30 hover:from-blue-100/50 hover:to-blue-200/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-heading text-3xl font-bold text-blue-900">Our Mission</h2>
              </div>
              <p className="text-blue-800/80 leading-relaxed text-lg">
                To create a seamless connection between blood and platelet donors and patients in need, ensuring that no
                one suffers due to lack of available blood or platelets. We believe in the power of community and the
                impact of voluntary donations.
              </p>
            </Card>

            <Card className="group p-10 border-0 bg-gradient-to-br from-purple-50/50 to-purple-100/30 hover:from-purple-100/50 hover:to-purple-200/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-heading text-3xl font-bold text-purple-900">Our Vision</h2>
              </div>
              <p className="text-purple-800/80 leading-relaxed text-lg">
                To build a world where blood and platelet donations are easily accessible, where donors are recognized
                and appreciated, and where every patient in need can find help within minutes. We envision a society
                where giving blood is a norm and saving lives is everyone's responsibility.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-card/30 to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">Our Core Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do and shape our commitment to the community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Compassion",
                description: "We care deeply about the wellbeing of both donors and patients.",
                color: "from-red-500 to-red-600",
                bgColor: "from-red-50/50 to-red-100/30",
                textColor: "text-red-900"
              },
              {
                icon: Shield,
                title: "Transparency",
                description: "We maintain complete transparency in all our operations and communications.",
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50/50 to-green-100/30",
                textColor: "text-green-900"
              },
              {
                icon: Zap,
                title: "Innovation",
                description: "We continuously innovate to improve our platform and services.",
                color: "from-yellow-500 to-yellow-600",
                bgColor: "from-yellow-50/50 to-yellow-100/30",
                textColor: "text-yellow-900"
              },
              {
                icon: Users,
                title: "Community",
                description: "We believe in the power of community and collective action.",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50/50 to-blue-100/30",
                textColor: "text-blue-900"
              },
              {
                icon: Award,
                title: "Reliability",
                description: "We are committed to being a reliable partner in times of need.",
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50/50 to-purple-100/30",
                textColor: "text-purple-900"
              },
              {
                icon: Globe,
                title: "Accessibility",
                description: "We make our services accessible to everyone, regardless of background.",
                color: "from-indigo-500 to-indigo-600",
                bgColor: "from-indigo-50/50 to-indigo-100/30",
                textColor: "text-indigo-900"
              },
            ].map((value, index) => (
              <Card key={index} className={`group p-8 border-0 bg-gradient-to-br ${value.bgColor} hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${value.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`font-heading text-xl font-semibold ${value.textColor}`}>{value.title}</h3>
                </div>
                <p className={`${value.textColor}/80 leading-relaxed`}>{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {/* <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-4xl font-bold mb-12 text-center">Our Team</h2>
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
                <h3 className="font-heading text-xl font-semibold">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section> */}
    </main>
  )
}
