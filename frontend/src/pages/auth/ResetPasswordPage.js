import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const otp = searchParams.get('otp');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const handleChange = (e) => {
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
      await authService.resetPassword(email, otp, formData.password);
      toast.success('Password reset successfully!');
      setIsSuccess(true);
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">Password Reset Successful</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Sign In Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary dark:text-accent" />
          </div>
          <h2 className="text-3xl font-bold text-primary dark:text-gray-100">Reset Password</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your new password for <span className="font-semibold">{email}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength="6"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200 pr-12"
                placeholder="Enter new password (min. 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200 pr-12"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-lg p-4 border border-secondary/20 dark:border-secondary/10">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Password requirements:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className={`flex items-center ${formData.password.length >= 6 ? 'text-green-600' : ''}`}>
                <span className="mr-2">{formData.password.length >= 6 ? '✓' : '•'}</span>
                At least 6 characters
              </li>
              <li className={`flex items-center ${formData.password === formData.confirmPassword && formData.password ? 'text-green-600' : ''}`}>
                <span className="mr-2">{formData.password === formData.confirmPassword && formData.password ? '✓' : '•'}</span>
                Passwords match
              </li>
            </ul>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading || formData.password.length < 6 || formData.password !== formData.confirmPassword}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;