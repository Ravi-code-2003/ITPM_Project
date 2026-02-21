import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Home, Users, BookOpen, ShoppingBag, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

// Debug mode
const DEBUG = process.env.NODE_ENV === 'development';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      if (DEBUG) {
        console.log('❌ LoginPage: Form validation failed', errors);
      }
      return;
    }

    if (DEBUG) {
      console.log('🔐 LoginPage: Starting login attempt...', { email: formData.email });
    }

    try {
      const response = await login(formData);
      
      if (DEBUG) {
        console.log('✅ LoginPage: Login successful!', {
          user: response.user,
          role: response.user?.role
        });
      }
      
      toast.success('Login successful!');
      
      // Redirect based on user role
      const user = response.user;
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        student: '/student/dashboard',
        'shop-owner': '/shop-owner/dashboard',
        'house-owner': '/house-owner/dashboard',
        'education-path': '/education-path/dashboard',
      };

      const redirectPath = dashboardRoutes[user.role] || from;
      
      if (DEBUG) {
        console.log('🚀 LoginPage: Redirecting to:', redirectPath);
      }
      
      navigate(redirectPath, { replace: true });
      
    } catch (error) {
      if (DEBUG) {
        console.error('❌ LoginPage: Login failed', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
      
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      
      // Handle specific error cases
      if (error.response?.data?.status === 'pending') {
        navigate('/pending-approval');
      }
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Back to Home Button - Absolute Top Left */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-50 inline-flex items-center px-4 py-2 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-sm border border-secondary/30 dark:border-secondary/20 rounded-lg hover:bg-surface dark:hover:bg-surface-dark transition-all duration-200 shadow-lg hover:shadow-xl group"
      >
        <Home className="h-4 w-4 mr-2 text-primary dark:text-accent group-hover:scale-110 transition-transform" />
        <span className="font-medium text-primary dark:text-gray-200">Back to Home</span>
      </Link>

      {/* Left Side - Meaningful Background with Illustrations */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary-600 to-primary-800 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-light rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-20 right-20 w-32 h-32 border-4 border-accent/30 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 border-4 border-accent/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent/20 rounded-lg rotate-45"></div>
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          {/* Logo/Heading */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-xl text-accent-light">Connect, Learn, and Grow with Student Connect</p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
            {/* Community Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-accent/30 transition-all duration-300 transform hover:scale-105">
              <Users className="h-10 w-10 mb-3 text-accent" />
              <h3 className="text-lg font-semibold mb-2">Student Community</h3>
              <p className="text-sm text-accent-light">Connect with peers worldwide</p>
            </div>

            {/* Housing Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-accent/30 transition-all duration-300 transform hover:scale-105">
              <Home className="h-10 w-10 mb-3 text-accent" />
              <h3 className="text-lg font-semibold mb-2">Find Housing</h3>
              <p className="text-sm text-accent-light">Discover student accommodations</p>
            </div>

            {/* Shopping Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-accent/30 transition-all duration-300 transform hover:scale-105">
              <ShoppingBag className="h-10 w-10 mb-3 text-accent" />
              <h3 className="text-lg font-semibold mb-2">Shop & Save</h3>
              <p className="text-sm text-accent-light">Student discounts and deals</p>
            </div>

            {/* Learning Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-accent/30 transition-all duration-300 transform hover:scale-105">
              <GraduationCap className="h-10 w-10 mb-3 text-accent" />
              <h3 className="text-lg font-semibold mb-2">Learn More</h3>
              <p className="text-sm text-accent-light">Access educational resources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface dark:bg-surface-dark">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary dark:text-gray-100 mb-2">Sign In</h2>
            <p className="text-secondary dark:text-gray-400">Enter your credentials to access your account</p>
          </div>

          {/* Global Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface dark:bg-surface-dark text-primary dark:text-gray-100 transition-all duration-200 ${
                    errors.email ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-secondary/30 dark:border-secondary/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface dark:bg-surface-dark text-primary dark:text-gray-100 transition-all duration-200 ${
                    errors.password ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-secondary/30 dark:border-secondary/20'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-secondary hover:text-primary dark:hover:text-accent transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover font-semibold transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface dark:bg-surface-dark text-secondary dark:text-gray-400">New to Student Connect?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/register">
                <Button variant="outline" className="w-full py-3">
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;