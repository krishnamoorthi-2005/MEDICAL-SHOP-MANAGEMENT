import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Shield, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-16 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-6">About Special Access Pharma</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your trusted healthcare partner, committed to providing quality medicines and exceptional care to our community for over a decade.
        </p>
      </section>

      {/* Story Section */}
      <section className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Founded in 2014, Special Access Pharma began with a simple mission: to make healthcare accessible and affordable for everyone in our community. What started as a small neighborhood pharmacy has grown into a comprehensive healthcare solution provider.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We combine traditional pharmaceutical expertise with modern technology to ensure our patients receive the best possible care. Our team of qualified pharmacists and healthcare professionals are dedicated to your health and wellbeing.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">10+</div>
                <div className="text-sm text-gray-600">Years of Service</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">50K+</div>
                <div className="text-sm text-gray-600">Customers Served</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">5K+</div>
                <div className="text-sm text-gray-600">Medicines Available</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-gray-600">Support Available</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16 -mx-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Care & Compassion</CardTitle>
                <CardDescription>
                  Every customer is treated with genuine care, understanding, and respect for their unique healthcare needs.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Quality & Safety</CardTitle>
                <CardDescription>
                  We maintain the highest standards in pharmaceutical care, ensuring every medicine meets strict quality requirements.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>
                  Making healthcare accessible 24/7 through our online platform and knowledgeable support team.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-gray-600">Experienced professionals dedicated to your health</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Shiva', role: 'Owner of the Shop', experience: '12 years' },
          ].map((member, index) => (
            <Card key={index}>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
                <div className="text-sm text-blue-600">{member.experience} experience</div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}