import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchMedicinesPublic, createCallRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Search, Phone, Mail, MapPin, Clock, Shield, Pill, Heart } from 'lucide-react';

export default function FrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [callRequestForm, setCallRequestForm] = useState({ name: '', phone: '', message: '' });
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);
  const { toast } = useToast();

  const handleMedicineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchMedicinesPublic(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: 'No Results',
          description: 'No medicines found matching your search.',
        });
      }
    } catch (error) {
      toast({
        title: 'Search Error',
        description: 'Failed to search medicines. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCallRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callRequestForm.name || !callRequestForm.phone) return;

    setIsSubmittingCall(true);
    try {
      await createCallRequest({
        name: callRequestForm.name,
        phone: callRequestForm.phone,
        message: callRequestForm.message
      });
      
      toast({
        title: 'Call Request Submitted',
        description: 'We will contact you shortly.',
      });
      setCallRequestForm({ name: '', phone: '', message: '' });
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'Failed to submit call request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCall(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Pill className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Your Trusted Healthcare Partner
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience seamless healthcare management with our comprehensive pharmacy services. 
            Quality medicines, expert care, and advanced technology all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Medicine Search Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Check Medicine Availability</h2>
            <p className="text-gray-600">Search our inventory to check if your medicines are in stock</p>
          </div>
          
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleMedicineSearch} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter medicine name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold">Search Results:</h3>
                  <div className="grid gap-3">
                    {searchResults.map((medicine) => (
                      <div key={medicine._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{medicine.name}</h4>
                          <p className="text-sm text-gray-600">{medicine.manufacturerId?.name || 'Unknown'} • {medicine.category || ''}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            medicine.stock > 10 
                              ? 'bg-green-100 text-green-800' 
                              : medicine.stock > 0 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {medicine.stock > 10 ? 'Available' 
                              : medicine.stock > 0 ? 'Limited' 
                              : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600">Comprehensive healthcare solutions for all your needs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Prescription Management</CardTitle>
                <CardDescription>
                  Easy prescription tracking and refill reminders
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Quality Assurance</CardTitle>
                <CardDescription>
                  All medicines verified for authenticity and quality
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>24/7 Support</CardTitle>
                <CardDescription>
                  Round-the-clock assistance for health emergencies
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact/Call Request Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Need Assistance?</h2>
            <p className="text-gray-600">Request a callback from our healthcare experts</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Request a Call</CardTitle>
                <CardDescription>Fill out this form and we'll call you back</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCallRequest} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={callRequestForm.name}
                      onChange={(e) => setCallRequestForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={callRequestForm.phone}
                      onChange={(e) => setCallRequestForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={callRequestForm.message}
                      onChange={(e) => setCallRequestForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="How can we help you?"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmittingCall}>
                    {isSubmittingCall ? 'Submitting...' : 'Request Call'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Phone className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Call Us</h3>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Email Us</h3>
                      <p className="text-gray-600">specialaccesspharma2021@gmail.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <MapPin className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Visit Us</h3>
                      <p className="text-gray-600">123 Healthcare Ave, Medical District</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}