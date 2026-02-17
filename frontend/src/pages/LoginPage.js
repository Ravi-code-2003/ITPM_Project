import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="text-center">
          <div className="bg-primary text-white p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-primary dark:text-gray-100">Sign in to your account</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Access your Student Connect dashboard</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface dark:bg-surface-dark py-8 px-4 shadow-soft-lg sm:rounded-xl sm:px-10 border border-secondary/20 dark:border-secondary/10">
          {/* Global Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary dark:text-gray-200">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 transition-colors duration-200 ${
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
              <label htmlFor="password" className="block text-sm font-medium text-primary dark:text-gray-200">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 transition-colors duration-200 ${
                    errors.password ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-secondary/30 dark:border-secondary/20'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors duration-200"
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
            <div className="flex items-center justify-between">
              <div></div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover font-medium transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary/20 dark:border-secondary/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface dark:bg-surface-dark text-gray-600 dark:text-gray-400">New to Student Connect?</span>
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