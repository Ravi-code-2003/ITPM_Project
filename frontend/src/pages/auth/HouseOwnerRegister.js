import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Upload, ArrowLeft, Eye, EyeOff, Building2, Key, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const HouseOwnerRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    propertyTitle: '',
    propertyAddress: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'house-owner',
        address: formData.propertyAddress
      };

      await authService.register(submitData);
      toast.success('Registration successful! Your application is being reviewed.');
      navigate('/pending-approval');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12 relative overflow-hidden">
      {/* Decorative Background Elements - Housing Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-10">
        <Home className="absolute top-24 left-16 w-36 h-36 text-primary transform rotate-12" />
        <Building2 className="absolute top-32 right-24 w-40 h-40 text-accent transform -rotate-6" />
        <Key className="absolute bottom-32 left-24 w-32 h-32 text-primary transform -rotate-12" />
        <MapPin className="absolute bottom-24 right-32 w-28 h-28 text-accent" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Back Button - Top Left */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary dark:text-gray-300 bg-surface dark:bg-surface-dark border border-secondary/30 dark:border-secondary/20 rounded-lg hover:bg-background dark:hover:bg-background-dark transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-primary to-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
            <Home className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100 mb-2 tracking-tight">House Owner Registration</h1>
          <p className="text-base text-secondary dark:text-gray-400">List your property for student accommodation</p>
        </div>

        {/* Registration Form */}
        <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-soft-lg border border-secondary/20 dark:border-secondary/10 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-1 h-5 bg-gradient-to-b from-primary to-primary-600 rounded-full mr-3"></div>
                <h3 className="text-lg font-bold text-primary dark:text-gray-100">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="border-t border-secondary/20 dark:border-secondary/10 pt-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-1 h-5 bg-gradient-to-b from-primary to-primary-600 rounded-full mr-3"></div>
                <h3 className="text-lg font-bold text-primary dark:text-gray-100">Property Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="propertyTitle" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    id="propertyTitle"
                    name="propertyTitle"
                    value={formData.propertyTitle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                    placeholder="e.g., Cozy 2-Bedroom Near Campus"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="propertyAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Property Address *
                  </label>
                  <textarea
                    id="propertyAddress"
                    name="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    required
                    rows="2"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                    placeholder="Complete property address"
                  />
                </div>


              </div>
            </div>



            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Submit Registration
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover font-semibold transition-colors">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HouseOwnerRegister;