import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      toast.success('OTP sent to your email');
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(error.message || 'Failed to send recovery email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
          <h2 className="text-3xl font-bold text-primary dark:text-gray-100 text-center">Forgot Password?</h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-colors duration-200"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send Recovery Email
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover transition-colors duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;