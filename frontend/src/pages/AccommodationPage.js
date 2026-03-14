import React from 'react';
import { Building2, MapPin, DollarSign, Users, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';

const AccommodationPage = () => {
  const accommodations = [
    {
      id: 1,
      name: "University Residence Hall A",
      type: "On-Campus Dormitory",
      description: "Modern dormitory with shared and private room options, located right on campus for maximum convenience.",
      location: "Main Campus, North Wing",
      price: "LKR 50/month",
      capacity: "Single, Double, or Quad occupancy",
      rating: 4.5,
      features: ["24/7 Security", "WiFi", "Laundry", "Study Rooms", "Common Kitchen"],
      amenities: ["Air Conditioning", "Attached Bathroom", "Study Desk", "Wardrobe"]
    },
    {
      id: 2,
      name: "Green Valley Student Apartments",
      type: "Off-Campus Apartment",
      description: "Fully furnished apartments perfect for students who prefer independent living with home-like comfort.",
      location: "2 km from Campus",
      price: "LKR 85/month",
      capacity: "1-3 students per unit",
      rating: 4.7,
      features: ["Furnished", "Kitchen", "Free Parking", "24/7 Security", "Gym Access"],
      amenities: ["Private Kitchen", "Living Room", "Balcony", "High-Speed Internet"]
    },
    {
      id: 3,
      name: "Student Housing Complex B",
      type: "On-Campus Apartment Style",
      description: "Apartment-style living on campus with shared facilities and a vibrant student community.",
      location: "Main Campus, South Block",
      price: "LKR 60/month",
      capacity: "2-4 students per apartment",
      rating: 4.3,
      features: ["Meal Plan Available", "Recreation Room", "WiFi", "Study Lounge", "Maintenance"],
      amenities: ["Shared Kitchen", "Common Area", "Private Bedroom", "Bathroom"]
    },
    {
      id: 4,
      name: "Lakeside Hostel",
      type: "Off-Campus Hostel",
      description: "Budget-friendly hostel accommodation with a friendly atmosphere, ideal for students on a tight budget.",
      location: "1.5 km from Campus (Near Lake)",
      price: "LKR 35/month",
      capacity: "Shared rooms (4-6 students)",
      rating: 4.0,
      features: ["Budget Friendly", "WiFi", "Common Kitchen", "Bike Storage", "Near Public Transport"],
      amenities: ["Shared Bathroom", "Locker", "Study Area", "Common Room"]
    },
    {
      id: 5,
      name: "Premium Student Studios",
      type: "Off-Campus Studio",
      description: "Luxurious studio apartments with modern amenities for students seeking comfort and privacy.",
      location: "3 km from Campus (City Center)",
      price: "LKR 115/month",
      capacity: "Single occupancy",
      rating: 4.8,
      features: ["Fully Furnished", "Housekeeping", "Gym", "Swimming Pool", "Security"],
      amenities: ["Private Kitchen", "Ensuite Bathroom", "Smart TV", "High-Speed Internet"]
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Header Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Student Accommodation</h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              Find your perfect home away from home. Explore various accommodation options
              designed specifically for student needs, from on-campus dorms to nearby apartments.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <Card className="mb-8 shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">Housing Options for Students</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We understand that finding the right accommodation is crucial for your academic success and overall
              well-being. Whether you prefer the convenience of on-campus housing or the independence of off-campus
              living, we have options to suit every preference and budget.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Safe & Secure</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">24/7 security and emergency support available</p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Fully Equipped</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Furnished rooms with essential amenities</p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Community Living</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Meet and connect with fellow students</p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Flexible Terms</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Semester or annual lease options available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Type Filter Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary dark:text-gray-100 mb-4">Browse Accommodation Options</h2>
          <div className="flex flex-wrap gap-3">
            <span className="bg-accent/20 dark:bg-accent/10 text-primary dark:text-accent px-4 py-2 rounded-full text-sm font-medium">
              On-Campus Housing
            </span>
            <span className="bg-accent/20 dark:bg-accent/10 text-primary dark:text-accent px-4 py-2 rounded-full text-sm font-medium">
              Off-Campus Apartments
            </span>
            <span className="bg-accent/20 dark:bg-accent/10 text-primary dark:text-accent px-4 py-2 rounded-full text-sm font-medium">
              Shared Accommodations
            </span>
            <span className="bg-accent/20 dark:bg-accent/10 text-primary dark:text-accent px-4 py-2 rounded-full text-sm font-medium">
              Private Studios
            </span>
          </div>
        </div>

        {/* Accommodation Listings */}
        <div className="space-y-6">
          {accommodations.map((accommodation) => (
            <Card key={accommodation.id} hover className="overflow-hidden shadow-soft">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary dark:text-gray-100 mb-2">{accommodation.name}</h3>
                    <p className="text-primary dark:text-accent font-medium">{accommodation.type}</p>
                  </div>
                  <div className="flex items-center bg-accent/20 dark:bg-accent/10 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-primary dark:text-accent mr-1 fill-current" />
                    <span className="font-semibold text-primary dark:text-accent">{accommodation.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">{accommodation.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Location</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{accommodation.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Rent</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{accommodation.price}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Capacity</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{accommodation.capacity}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-primary dark:text-gray-200 mb-2">Key Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {accommodation.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-accent/10 dark:bg-accent/5 text-primary dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-primary dark:text-gray-200 mb-2">Room Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {accommodation.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-secondary/10 dark:bg-secondary/5 text-secondary dark:text-gray-400 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-secondary/20 dark:border-secondary/10">
                  <Button>
                    Request Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Application Process */}
        <Card className="mt-12 shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">How to Apply</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="bg-accent/20 dark:bg-accent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary dark:text-accent font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-2">Browse Options</h3>
                <p className="text-sm text-secondary dark:text-gray-400">Review available accommodations and select your preference</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-accent/20 dark:bg-accent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary dark:text-accent font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-2">Submit Application</h3>
                <p className="text-sm text-secondary dark:text-gray-400">Complete online application with required documents</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-accent/20 dark:bg-accent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary dark:text-accent font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-2">Review & Approval</h3>
                <p className="text-sm text-secondary dark:text-gray-400">Application reviewed within 3-5 business days</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-accent/20 dark:bg-accent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary dark:text-accent font-bold text-xl">4</span>
                </div>
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-2">Move In</h3>
                <p className="text-sm text-secondary dark:text-gray-400">Sign lease and move into your new home</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mt-8 shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">Important Information</h2>
            <div className="prose max-w-none text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li>All accommodations require a refundable security deposit</li>
                <li>Utilities may be included or charged separately depending on the property</li>
                <li>Most properties require a minimum 6-month lease commitment</li>
                <li>Student ID verification required for all bookings</li>
                <li>Early application recommended - spaces fill up quickly!</li>
                <li>Financial aid and payment plans available for eligible students</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mt-8 bg-accent/10 dark:bg-accent/5 shadow-soft">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">Need Help Finding Accommodation?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our housing services team is here to assist you in finding the perfect accommodation.
              Contact us for personalized recommendations, virtual tours, or any questions about the application process.
            </p>
            <div className="flex gap-4">
              <a href="/contact">
                <Button>
                  Contact Housing Services
                </Button>
              </a>
              <a href="/register">
                <Button variant="outline">
                  Apply Now
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccommodationPage;
