import React from 'react';
import { UtensilsCrossed, MapPin, Clock, Star, Phone, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const RestaurantsPage = () => {
  const restaurants = [
    {
      id: 1,
      name: "Campus Cafe",
      cuisine: "International",
      description: "A cozy cafe offering a variety of international dishes, perfect for students looking for quick meals between classes.",
      location: "Building A, Ground Floor",
      hours: "7:00 AM - 8:00 PM",
      price: "$$",
      rating: 4.5,
      contact: "+94 11 234 5678",
      features: ["Free WiFi", "Student Discounts", "Takeaway Available"]
    },
    {
      id: 2,
      name: "The Food Court",
      cuisine: "Multi-Cuisine",
      description: "Large food court with multiple vendors offering Sri Lankan, Chinese, Indian, and Western food options.",
      location: "Main Campus, Level 2",
      hours: "8:00 AM - 9:00 PM",
      price: "$",
      rating: 4.2,
      contact: "+94 11 234 5679",
      features: ["Multiple Options", "Budget Friendly", "Quick Service"]
    },
    {
      id: 3,
      name: "Green Leaf Restaurant",
      cuisine: "Vegetarian & Vegan",
      description: "Healthy vegetarian and vegan options with organic ingredients. Perfect for health-conscious students.",
      location: "Near Library Building",
      hours: "9:00 AM - 7:00 PM",
      price: "$$",
      rating: 4.7,
      contact: "+94 11 234 5680",
      features: ["Organic", "Vegan Options", "Healthy Meals"]
    },
    {
      id: 4,
      name: "Spice Route",
      cuisine: "Asian Fusion",
      description: "Authentic Asian cuisine with a modern twist. Great for students craving flavorful meals.",
      location: "Campus Street, Block C",
      hours: "11:00 AM - 10:00 PM",
      price: "$$$",
      rating: 4.6,
      contact: "+94 11 234 5681",
      features: ["Dine-in", "Delivery", "Special Events"]
    }
  ];

  const getPriceLevel = (price) => {
    const levels = {
      '$': 'Budget Friendly (LKR 200-500)',
      '$$': 'Moderate (LKR 500-1000)',
      '$$$': 'Premium (LKR 1000+)'
    };
    return levels[price] || price;
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Header Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <UtensilsCrossed className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Campus Restaurants & Dining</h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              Discover delicious food options on and around campus. From quick bites to sit-down meals,
              we've got something for every taste and budget.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <Card className="mb-8 shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">Dining Options for Students</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our campus offers a diverse range of dining options to cater to all tastes and dietary preferences.
              Whether you're looking for a quick snack between classes, a healthy meal, or a place to socialize
              with friends, you'll find the perfect spot here.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Student Discounts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Most restaurants offer 10-20% discounts with valid student ID</p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Meal Plans Available</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Purchase monthly or semester meal plans for additional savings</p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary dark:text-accent mb-2">Dietary Options</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vegetarian, vegan, halal, and gluten-free options available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Listings */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-primary dark:text-gray-100">Featured Restaurants</h2>
          
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} hover className="overflow-hidden shadow-soft">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary dark:text-gray-100 mb-2">{restaurant.name}</h3>
                    <p className="text-primary dark:text-accent font-medium">{restaurant.cuisine}</p>
                  </div>
                  <div className="flex items-center bg-accent/20 dark:bg-accent/10 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-primary dark:text-accent mr-1 fill-current" />
                    <span className="font-semibold text-primary dark:text-accent">{restaurant.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">{restaurant.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Location</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{restaurant.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Hours</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{restaurant.hours}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Price Range</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getPriceLevel(restaurant.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-200">Contact</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{restaurant.contact}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {restaurant.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-accent/10 dark:bg-accent/5 text-primary dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <Card className="mt-12 shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">Food Safety & Quality</h2>
            <div className="prose max-w-none text-gray-600 dark:text-gray-300">
              <p className="mb-4">
                All campus dining facilities maintain the highest standards of food safety and hygiene.
                Regular inspections are conducted to ensure compliance with health regulations.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>All vendors are licensed and certified</li>
                <li>Regular health and safety inspections</li>
                <li>Fresh ingredients sourced daily</li>
                <li>Allergen information available upon request</li>
                <li>Feedback and complaint system in place</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-accent/10 dark:bg-accent/5 shadow-soft">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">Need Help Finding Food Options?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our student services team is here to help you navigate dining options on campus.
              Contact us for recommendations, dietary accommodations, or meal plan information.
            </p>
            <a
              href="/contact"
            >
              <Button>
                Contact Us
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantsPage;
