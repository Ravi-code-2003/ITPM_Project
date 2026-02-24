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
  Clock,
  Shield,
  Sparkles,
  Zap
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
    <div className="min-h-screen bg-background dark:bg-background-dark relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link to="/">
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary dark:text-gray-300 bg-surface dark:bg-surface-dark border border-secondary/30 dark:border-secondary/20 rounded-lg hover:bg-background dark:hover:bg-background-dark transition-all duration-200 shadow-sm hover:shadow-md group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </button>
          </Link>
        </div>
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-gray-100 mb-4 tracking-tight">
            Join UniCore
          </h1>
          <p className="text-lg md:text-xl text-secondary dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Choose your account type to get started. Students get instant access, 
            while service providers require admin approval.
          </p>
        </div>

        {/* Registration Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {registrationOptions.map((option, index) => (
            <Card
              key={option.role}
              className="hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 group border-2 border-transparent hover:border-primary/20 dark:hover:border-accent/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                {/* Icon with gradient background */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {option.icon}
                  </div>
                  {option.approvalStatus === 'instant' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Title and Description */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-primary dark:text-gray-100 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-secondary dark:text-gray-400 leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {/* Approval Status Badge */}
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mb-5 ${
                  option.approvalStatus === 'instant' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                    : 'bg-accent/20 dark:bg-accent/10 text-primary dark:text-accent border border-accent/30 dark:border-accent/20'
                }`}>
                  {option.approvalStatus === 'instant' ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Instant Access
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Admin Approval
                    </>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start text-sm text-secondary dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-primary dark:text-accent mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Register Button */}
                <Link to={option.path}>
                  <Button className="w-full group/btn">
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-primary dark:text-gray-100 mb-3">
              How Registration Works
            </h2>
            <p className="text-secondary dark:text-gray-400 max-w-2xl mx-auto">
              Understanding the registration and approval process for different account types
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Registration Card */}
            <Card className="border-2 border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/10">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary dark:text-gray-100">Student Registration</h3>
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Instant Activation</p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start text-secondary dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs font-bold">1</span>
                    </span>
                    <span>Fill out the simple registration form</span>
                  </li>
                  <li className="flex items-start text-secondary dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs font-bold">2</span>
                    </span>
                    <span>Account activated immediately</span>
                  </li>
                  <li className="flex items-start text-secondary dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs font-bold">3</span>
                    </span>
                    <span>Start exploring deals and services</span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-green-200 dark:border-green-800/30">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-semibold text-primary dark:text-gray-100">No waiting time required</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Provider Registration Card */}
            <Card className="border-2 border-accent/30 dark:border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/5 dark:to-accent/10">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary dark:text-gray-100">Service Provider</h3>
                    <p className="text-sm text-primary dark:text-accent font-semibold">Admin Approval Process</p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start text-secondary dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-accent/20 dark:bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-primary dark:text-accent text-xs font-bold">1</span>
                    </span>
                    <span>Submit registration with business details</span>
                  </li>
                  <li className="flex items-start text-secondary dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-accent/20 dark:bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-primary dark:text-accent text-xs font-bold">2</span>
                    </span>
                    <span>Admin reviews your application</span>
                  </li>
                  <li className="flex items-start text-secondary dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-accent/20 dark:bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-primary dark:text-accent text-xs font-bold">3</span>
                    </span>
                    <span>Receive email notification upon approval</span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-accent/30 dark:border-accent/20">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary dark:text-accent mr-2" />
                    <span className="text-sm font-semibold text-primary dark:text-gray-100">Typical approval: 1-2 business days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust & Security Banner */}
        <Card className="mb-12 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 dark:from-primary/10 dark:via-accent/10 dark:to-primary/10 border-2 border-primary/20 dark:border-primary/30">
          <CardContent className="p-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary dark:text-accent mr-3" />
              <h3 className="text-2xl font-bold text-primary dark:text-gray-100">Your Data is Secure</h3>
            </div>
            <p className="text-center text-secondary dark:text-gray-300 max-w-3xl mx-auto mb-6">
              We use industry-standard encryption and security measures to protect your personal information. 
              Your data is never shared with third parties without your consent.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-secondary dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary dark:text-accent mr-2" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary dark:text-accent mr-2" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary dark:text-accent mr-2" />
                <span>Secure Storage</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary dark:text-accent mr-2" />
                <span>Privacy Protected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;