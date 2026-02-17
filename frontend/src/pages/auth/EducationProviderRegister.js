import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Upload, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const EducationProviderRegister = () => {
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
    organizationName: '',
    organizationAddress: '',
    organizationDescription: '',
    website: '',
    specializations: '',
    accreditation: null,
    organizationImages: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'accreditation') {
      setFormData(prev => ({
        ...prev,
        accreditation: files[0]
      }));
    } else if (name === 'organizationImages') {
      setFormData(prev => ({
        ...prev,
        organizationImages: Array.from(files).slice(0, 5) // Max 5 images
      }));
    }
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

    if (!formData.accreditation) {
      toast.error('Accreditation document is required');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('role', 'education-path');
      submitData.append('organizationName', formData.organizationName);
      submitData.append('organizationType', formData.organizationType);
      submitData.append('organizationEmail', formData.organizationEmail);
      submitData.append('proofImage', formData.accreditation);

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
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100 mb-2">Education Provider Registration</h1>
          <p className="text-gray-600 dark:text-gray-400">Share your expertise and teach students</p>
        </div>

        {/* Registration Form */}
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b border-secondary/20 dark:border-secondary/10 pb-6">
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="mt-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

            {/* Organization Information */}
            <div className="border-b border-secondary/20 dark:border-secondary/10 pb-6">
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Organization Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                    placeholder="Your organization or institution name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="specializations" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                      Specializations *
                    </label>
                    <input
                      type="text"
                      id="specializations"
                      name="specializations"
                      value={formData.specializations}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
                      placeholder="e.g., Computer Science, Business, Arts"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="organizationAddress" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Organization Address *
                  </label>
                  <textarea
                    id="organizationAddress"
                    name="organizationAddress"
                    value={formData.organizationAddress}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200 resize-none"
                    placeholder="Complete organization address"
                  />
                </div>
                
                <div>
                  <label htmlFor="organizationDescription" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Organization Description *
                  </label>
                  <textarea
                    id="organizationDescription"
                    name="organizationDescription"
                    value={formData.organizationDescription}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200 resize-none"
                    placeholder="Describe your organization, expertise, teaching philosophy, and programs you offer"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Required Documents</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="accreditation" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Accreditation/Certification Document *
                  </label>
                  <div className="border-2 border-dashed border-secondary/30 dark:border-secondary/20 rounded-lg p-4 hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="accreditation"
                      name="accreditation"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Upload teaching license, accreditation, or professional certification (PDF, JPG, or PNG)
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="organizationImages" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Organization Images (Optional)
                  </label>
                  <div className="border-2 border-dashed border-secondary/30 dark:border-secondary/20 rounded-lg p-4 hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="organizationImages"
                      name="organizationImages"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png"
                      multiple
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Upload up to 5 images of your organization, facilities, or certificates (JPG or PNG only)
                    </p>
                  </div>
                </div>
              </div>
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

export default EducationProviderRegister;