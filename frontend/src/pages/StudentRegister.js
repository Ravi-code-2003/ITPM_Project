import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary dark:text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100 mb-2">Student Registration</h1>
          <p className="text-gray-600 dark:text-gray-400">Join Student Connect and unlock campus opportunities</p>
        </div>

        {/* Registration Form */}
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="your@university.edu"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="border-t border-secondary/20 dark:border-secondary/10 pt-6">
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Student Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="e.g., ST123456"
                  />
                </div>
                
                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    University/College *
                  </label>
                  <input
                    type="text"
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="Your university name"
                  />
                </div>
                
                <div>
                  <label htmlFor="yearOfStudy" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Year of Study *
                  </label>
                  <select
                    id="yearOfStudy"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
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
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Security</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
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
                      className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200 pr-12"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
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
                      className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200 pr-12"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Note */}
            <div className="bg-accent/20 rounded-lg p-4">
              <h4 className="font-semibold text-primary dark:text-gray-100 mb-2">Student Benefits:</h4>
              <ul className="text-sm text-primary dark:text-gray-200 space-y-1">
                <li>• Instant account activation</li>
                <li>• Access to food deals and discounts</li>
                <li>• Find verified accommodation</li>
                <li>• Join education programs and workshops</li>
                <li>• Connect with other students</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
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

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover font-medium">
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