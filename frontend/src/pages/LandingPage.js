import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  ShoppingBag, 
  Home, 
  GraduationCap,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const LandingPage = () => {
  const features = [
    {
      icon: <ShoppingBag className="h-12 w-12 text-orange-600" />,
      title: "Food & Dining",
      description: "Discover the best local restaurants and food deals near your campus. Get exclusive student discounts.",
      color: "orange"
    },
    {
      icon: <Home className="h-10 w-10 text-blue-600" />,
      title: "Accommodation",
      description: "Find safe, affordable housing options. Browse rooms, apartments, and shared accommodations.",
      color: "blue"
    },
    {
      icon: <GraduationCap className="h-12 w-12 text-purple-600" />,
      title: "Education Programs",
      description: "Access skill development courses, workshops, and certification programs to boost your career.",
      color: "purple"
    },
    {
      icon: <Users className="h-12 w-12 text-green-600" />,
      title: "Student Services",
      description: "Connect with fellow students, join study groups, and access various student support services.",
      color: "green"
    }
  ];

  const benefits = [
    "Verified service providers",
    "Exclusive student discounts",
    "24/7 customer support",
    "Secure payment processing",
    "Community-driven reviews",
    "Mobile-friendly platform"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Student",
      content: "Student Connect helped me find an amazing apartment near campus at an affordable price. The platform is so easy to use!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Business Student",
      content: "I love the food discounts available through Student Connect. I've saved hundreds of dollars this semester!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Engineering Student",
      content: "The education programs section helped me learn new skills that landed me a great internship. Highly recommend!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero Section */}
      <section className="relative bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your Campus Life,
              <span className="block text-accent">Simplified</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              Connect with food, accommodation, and education opportunities designed specifically for students
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="text-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/education-programs">
                <Button size="lg" variant="secondary" className="text-lg">
                  Explore Programs
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent rounded-full opacity-10 animate-pulse delay-1000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-gray-100 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Student Connect brings together all the essential services you need for a successful campus experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hover className="text-center transition-all duration-300 transform hover:-translate-y-2">
                <CardContent>
                  <div className="mb-6 flex justify-center">
                    {feature.icon}
                  </div>
                  <CardTitle className="mb-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-surface dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-gray-100 mb-4">
              How Student Connect Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Simple steps to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-accent/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary dark:text-accent">1</span>
              </div>
              <h3 className="text-xl font-bold text-primary dark:text-gray-100 mb-4">Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400">Create your free student account in under 2 minutes. No hidden fees or commitments.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary dark:text-accent">2</span>
              </div>
              <h3 className="text-xl font-bold text-primary dark:text-gray-100 mb-4">Explore</h3>
              <p className="text-gray-600 dark:text-gray-400">Browse food options, accommodation, and educational programs tailored for students.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary dark:text-accent">3</span>
              </div>
              <h3 className="text-xl font-bold text-primary dark:text-gray-100 mb-4">Connect</h3>
              <p className="text-gray-600 dark:text-gray-400">Connect with verified providers and enjoy exclusive student benefits and discounts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-accent/10 dark:bg-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-gray-100 mb-6">
                Why Students Choose Us
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of students who trust Student Connect for their campus needs
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-accent mr-3" />
                    <span className="text-primary dark:text-gray-200">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="shadow-soft-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Student Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary dark:text-accent mb-2">10,000+</div>
                    <div className="text-gray-600 dark:text-gray-400">Active Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary dark:text-accent mb-2">500+</div>
                    <div className="text-gray-600 dark:text-gray-400">Partner Businesses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary dark:text-accent mb-2">50+</div>
                    <div className="text-gray-600 dark:text-gray-400">Education Programs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary dark:text-accent mb-2">95%</div>
                    <div className="text-gray-600 dark:text-gray-400">Satisfaction Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Students Say
            </h2>
            <p className="text-xl text-gray-300">
              Real experiences from real students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-accent fill-current" />
                  ))}
                </div>
                <p className="text-gray-100 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-gray-300 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Campus Experience?
          </h2>
          <p className="text-xl mb-8 text-gray-100">
            Join Student Connect today and discover everything your campus has to offer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/student">
              <Button size="lg" variant="secondary" className="text-lg">
                Join as Student
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-lg">
                Browse All Options
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;