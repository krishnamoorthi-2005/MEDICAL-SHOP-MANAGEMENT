import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Pill, 
  Heart, 
  Shield, 
  Clock, 
  Phone, 
  Truck, 
  FileText, 
  Users, 
  Stethoscope,
  Calculator,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

export default function Services() {
  return (
    <div className="space-y-16 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-6">Our Services</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive healthcare solutions designed to meet all your pharmaceutical and wellness needs
        </p>
      </section>

      {/* Core Services */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Core Pharmacy Services</h2>
          <p className="text-gray-600">Essential services for your daily healthcare needs</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Pill className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Prescription Fulfillment</CardTitle>
              <CardDescription>
                Fast and accurate prescription processing with quality medications from trusted manufacturers
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Learn More</Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Health Consultations</CardTitle>
              <CardDescription>
                One-on-one consultations with certified pharmacists for medication advice and health guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Book Consultation</Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Home Delivery</CardTitle>
              <CardDescription>
                Convenient doorstep delivery of your medications with secure packaging and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Order Online</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Specialized Services */}
      <section className="bg-gray-50 py-16 -mx-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Specialized Services</h2>
            <p className="text-gray-600">Advanced healthcare solutions for specific needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <FileText className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <CardTitle className="text-lg">Medication Reviews</CardTitle>
                <CardDescription className="text-sm">
                  Comprehensive review of all your medications to check for interactions
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <CardTitle className="text-lg">Family Health Plans</CardTitle>
                <CardDescription className="text-sm">
                  Customized health management plans for your entire family
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Stethoscope className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <CardTitle className="text-lg">Health Screenings</CardTitle>
                <CardDescription className="text-sm">
                  Regular health check-ups and basic diagnostic services
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Calculator className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <CardTitle className="text-lg">Insurance Assistance</CardTitle>
                <CardDescription className="text-sm">
                  Help with insurance claims and coverage optimization
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Digital Services */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Digital Health Solutions</h2>
          <p className="text-gray-600">Modern technology for better healthcare management</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader className="text-center">
              <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Mobile App</CardTitle>
              <CardDescription>
                Track prescriptions, set reminders, and reorder medications through our mobile app
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Medication Alerts</CardTitle>
              <CardDescription>
                Automated reminders for medication times, refills, and important health updates
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>24/7 Support</CardTitle>
              <CardDescription>
                Round-the-clock customer support for urgent medication questions and emergencies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Emergency Services */}
      <section className="bg-blue-50 py-16 -mx-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Phone className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Emergency Services</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            For urgent medication needs or health emergencies, our team is available 24/7 to provide immediate assistance and guidance.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              Emergency Hotline: (555) 911-MEDS
            </Button>
          </div>
        </div>
      </section>

      {/* Service Guarantee */}
      <section className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Our Service Promise</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Quality Guaranteed</h3>
            <p className="text-gray-600 text-sm">All medications are sourced from certified manufacturers and undergo strict quality checks</p>
          </div>
          <div>
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Fast Service</h3>
            <p className="text-gray-600 text-sm">Most prescriptions ready within 15 minutes, with express options available</p>
          </div>
          <div>
            <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Personalized Care</h3>
            <p className="text-gray-600 text-sm">Every customer receives individual attention and customized health solutions</p>
          </div>
        </div>
      </section>
    </div>
  );
}