import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowLeft, BookOpen, Award, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import Button from '../components/ui/Button';

const StudentRegister = () => {
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
    studentId: '',
    university: '',
    yearOfStudy: ''
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
        role: 'student'
      };

      await authService.register(submitData);
      toast.success('Registration successful! You can now sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12 relative overflow-hidden">
      {/* Decorative Background Elements - Education Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-10">
        <BookOpen className="absolute top-20 left-10 w-32 h-32 text-primary transform rotate-12" />
        <GraduationCap className="absolute top-40 right-20 w-40 h-40 text-accent transform -rotate-12" />
        <Award className="absolute bottom-40 left-20 w-28 h-28 text-primary transform" />
        <Users className="absolute bottom-20 right-32 w-36 h-36 text-accent transform rotate-6" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl opacity-20"></div>
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-primary to-primary-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-primary dark:text-gray-100 mb-3 tracking-tight">Student Registration</h1>
          <p className="text-lg text-secondary dark:text-gray-400">Join Student Connect and unlock campus opportunities</p>
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
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
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
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                    placeholder="your@university.edu"
                  />
                </div>
                
                <div className="md:col-span-2">
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
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="border-t border-secondary/20 dark:border-secondary/10 pt-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-1 h-5 bg-gradient-to-b from-primary to-primary-600 rounded-full mr-3"></div>
                <h3 className="text-lg font-bold text-primary dark:text-gray-100">Student Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 shadow-sm"
                    placeholder="e.g., ST123456"
                  />
                </div>
                
                <div>
                  <label htmlFor="university" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    University/College *
                  </label>
                  <input
                    type="text"
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 shadow-sm"
                    placeholder="Your university name"
                  />
                </div>
                
                <div>
                  <label htmlFor="yearOfStudy" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Year of Study *
                  </label>
                  <select
                    id="yearOfStudy"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate">Graduate</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-secondary/20 dark:border-secondary/10 pt-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-1 h-5 bg-gradient-to-b from-primary to-primary-600 rounded-full mr-3"></div>
                <h3 className="text-lg font-bold text-primary dark:text-gray-100">Security</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
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
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
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

            {/* Benefits Note */}
            <div className="bg-gradient-to-br from-accent/20 to-accent-light/20 dark:from-accent/10 dark:to-accent/5 border border-accent/30 dark:border-accent/20 rounded-xl p-4">
              <h4 className="font-bold text-primary dark:text-gray-100 mb-2.5 flex items-center text-sm">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                Student Benefits
              </h4>
              <ul className="text-xs text-secondary dark:text-gray-300 space-y-1.5">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Instant account activation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Access to food deals and discounts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Find verified accommodation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Join education programs and workshops</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Connect with other students</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  'Create Student Account'
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 font-semibold transition-colors">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;