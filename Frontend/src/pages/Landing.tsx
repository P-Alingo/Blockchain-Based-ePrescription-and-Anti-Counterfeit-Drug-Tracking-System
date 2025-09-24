import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Users, CheckCircle, Star, ArrowRight, FileText, Scan, Database, TrendingUp, Instagram, Twitter, Youtube, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-healthcare.jpg';
import testimonialDoctor from '@/assets/testimonial-doctor-1.jpg';
import testimonialPharmacist from '@/assets/testimonial-pharmacist-1.jpg';
import testimonialAdmin from '@/assets/testimonial-admin-1.jpg';

const Landing = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Immutable prescription records secured by blockchain technology"
    },
    {
      icon: Scan,
      title: "QR Code Verification",
      description: "Instant prescription verification through secure QR codes"
    },
    {
      icon: Database,
      title: "Drug Tracking",
      description: "Complete supply chain visibility from manufacturer to patient"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Monitor prescription patterns and prevent counterfeit drugs"
    }
  ];

  const userRoles = [
    { name: "Doctor", count: "2,500+", description: "Prescribing physicians" },
    { name: "Patient", count: "15,000+", description: "Registered patients" },
    { name: "Pharmacist", count: "800+", description: "Licensed pharmacies" },
    { name: "Manufacturer", count: "150+", description: "Verified manufacturers" },
    { name: "Distributor", count: "300+", description: "Authorized distributors" },
    { name: "Regulator", count: "25+", description: "Regulatory bodies" }
  ];

  const testimonials = [
    {
      name: "Dr. Amina Hassan",
      role: "Senior Physician, Kenyatta Hospital",
      image: testimonialDoctor,
      content: "This system has transformed how we handle prescriptions. The blockchain verification gives us complete confidence in prescription authenticity.",
      rating: 5
    },
    {
      name: "Samuel Kimani",
      role: "Chief Pharmacist, Nairobi Pharmacy",
      image: testimonialPharmacist,
      content: "QR code scanning has made dispensing so much faster and more secure. We can instantly verify every prescription's authenticity.",
      rating: 5
    },
    {
      name: "Grace Wanjiku",
      role: "Healthcare Administrator, MOH",
      image: testimonialAdmin,
      content: "The regulatory oversight features have dramatically improved our ability to track and prevent counterfeit drugs in Kenya.",
      rating: 5
    }
  ];

  // FAQ Data for landing page footer
  const faqs = [
    {
      question: 'How does ePrescribe Kenya ensure prescription security?',
      answer: 'We use blockchain technology to create immutable records that prevent counterfeit prescriptions.'
    },
    {
      question: 'Can patients verify their prescriptions?',
      answer: 'Yes, patients and pharmacists can verify prescriptions instantly using QR code scanning.'
    },
    {
      question: 'Who can join this platform?',
      answer: 'Doctors, patients, pharmacists, manufacturers, distributors, and regulators across Kenya.'
    },
    {
      question: 'How can I contact support?',
      answer: 'Use the contact information provided below or visit our support pages.'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">ePrescribe Kenya</span>
          </div>
          <div className="flex space-x-3">
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-primary/10">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="btn-gradient-primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10"></div>
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
              🇰🇪 Powered by Blockchain Technology
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gradient">Secure Digital</span><br />
              <span className="text-foreground">Prescriptions for</span><br />
              <span className="text-primary">Kenya</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              Revolutionary blockchain-based ePrescription system that eliminates counterfeit drugs and ensures patient safety across Kenya's healthcare network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="btn-gradient-primary text-lg px-8 py-4">
                  Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-primary/30 hover:bg-primary/5">
                <FileText className="mr-2 w-5 h-5" />
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="Healthcare professionals using blockchain technology" 
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets healthcare excellence in Kenya's most trusted prescription system
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`card-elevated cursor-pointer transition-all duration-300 ${
                  activeFeature === index ? 'ring-2 ring-primary scale-105' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of healthcare stakeholders using our platform
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {userRoles.map((role, index) => (
              <Card key={index} className="card-elevated text-center">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-primary mb-2">{role.count}</div>
                  <div className="font-semibold mb-1">{role.name}s</div>
                  <div className="text-sm text-muted-foreground">{role.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground">
              Real experiences from healthcare professionals across Kenya
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-elevated">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Healthcare?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Kenya's leading blockchain-powered prescription system and help eliminate counterfeit drugs
          </p>
          <Link to="/register">
            <Button size="lg" className="btn-gradient-primary text-lg px-12 py-4">
              Get Started Today <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-muted/30 py-16 px-6 sm:px-12 lg:px-24 text-background mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary">Contact Us</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-primary" />
                <span>support@eprescribe.ke</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-primary" />
                <span>+254 700 123 456</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary">Follow Us</h3>
            <div className="flex space-x-6 text-muted-foreground">
              <a
                href="https://instagram.com/eprescribe.ke"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-primary transition"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://twitter.com/eprescribe_ke"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-primary transition"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="https://tiktok.com/@eprescribe.ke"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="hover:text-primary transition"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary">FAQs</h3>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="space-y-1">
                <p className="font-semibold">How does ePrescribe Kenya ensure prescription security?</p>
                <p>We use blockchain technology to create immutable records that prevent counterfeit prescriptions.</p>
              </li>
              <li className="space-y-1">
                <p className="font-semibold">Can patients verify their prescriptions?</p>
                <p>Yes, patients and pharmacists can verify prescriptions instantly using QR code scanning.</p>
              </li>
              <li className="space-y-1">
                <p className="font-semibold">Who can join this platform?</p>
                <p>Doctors, patients, pharmacists, manufacturers, distributors, and regulators across Kenya.</p>
              </li>
              <li className="space-y-1">
                <p className="font-semibold">How can I contact support?</p>
                <p>Use the contact information provided or visit our support pages.</p>
              </li>
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary">About Us</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ePrescribe Kenya is dedicated to securing Kenya's healthcare future through blockchain technology. We provide a cutting-edge digital prescription platform that empowers healthcare professionals and patients while eliminating counterfeit drugs.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} ePrescribe Kenya. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;