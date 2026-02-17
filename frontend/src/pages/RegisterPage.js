import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  Home, 
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const RegisterPage = () => {
  const registrationOptions = [
    {
      role: 'student',
      title: 'Student',
      description: 'Access food deals, accommodation, and education programs',
      icon: <Users className="h-12 w-12 text-primary dark:text-accent" />,
      features: ['Instant access', 'Food discounts', 'Accommodation search', 'Education programs'],
      approvalStatus: 'instant',
      path: '/register/student'
    },
    {
      role: 'shop-owner',
      title: 'Shop Owner',
      description: 'List your food business and connect with students',
      icon: <ShoppingBag className="h-12 w-12 text-primary dark:text-accent" />,
      features: ['Business listing', 'Student customers', 'Special offers', 'Business analytics'],
      approvalStatus: 'approval',
      path: '/register/shop-owner'
    },
    {
      role: 'house-owner',
      title: 'House Owner',
      description: 'Rent out rooms and properties to students',
      icon: <Home className="h-12 w-12 text-primary dark:text-accent" />,
      features: ['Property listing', 'Tenant management', 'Secure payments', 'Property analytics'],
      approvalStatus: 'approval',
      path: '/register/house-owner'
    },
    {
      role: 'education-path',
      title: 'Education Provider', 
      description: 'Offer skill development programs and courses',
      icon: <GraduationCap className="h-12 w-12 text-primary dark:text-accent" />,
      features: ['Program listing', 'Student enrollment', 'Course materials', 'Progress tracking'],
      approvalStatus: 'approval',
      path: '/register/education-path'
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-gray-100 mb-4">
            Join Student Connect
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose your account type to get started. Students get instant access, 
            while service providers require admin approval.
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {registrationOptions.map((option) => (
            <Card
              key={option.role}
              className="hover:shadow-soft-xl transition-all duration-300 group"
            >
              <CardContent className="p-8">
                {/* Icon and Title */}
                <div className="text-center mb-6">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-primary dark:text-gray-100 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {/* Approval Status */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  option.approvalStatus === 'instant' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                    : 'bg-accent/20 text-primary dark:text-accent'
                }`}>
                  {option.approvalStatus === 'instant' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {option.approvalStatus === 'instant' ? 'Instant Access' : 'Admin Approval Required'}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Register Button */}
                <Link to={option.path}>
                  <Button className="w-full">
                    Register Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Registration Process</CardTitle>
            <CardDescription>
              Understanding how the approval process works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Registration */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800/50">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                  <h3 className="text-lg font-semibold text-primary dark:text-gray-100">Students</h3>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Instant account activation</li>
                  <li>• Only basic information required</li>
                  <li>• Immediate access to all student features</li>
                  <li>• No document uploads needed</li>
                </ul>
              </div>

              {/* Service Provider Registration */}
              <div className="bg-accent/20 dark:bg-accent/10 rounded-xl p-6 border border-accent/30 dark:border-accent/20">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 text-primary dark:text-accent mr-2" />
                  <h3 className="text-lg font-semibold text-primary dark:text-gray-100">Service Providers</h3>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Admin approval required</li>
                  <li>• Business/property documentation needed</li>
                  <li>• Verification process (1-2 days)</li>
                  <li>• Email notification upon approval</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover font-medium transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;