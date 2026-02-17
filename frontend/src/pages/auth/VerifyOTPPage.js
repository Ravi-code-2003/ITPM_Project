import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyOTP(email, otpString);
      toast.success('OTP verified successfully!');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otpString}`);
    } catch (error) {
      toast.error(error.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.forgotPassword(email);
      toast.success('New OTP sent to your email');
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={() => navigate('/forgot-password')}
            className="inline-flex items-center text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <div className="text-center">
            <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary dark:text-accent" />
            </div>
            <h2 className="text-3xl font-bold text-primary dark:text-gray-100">Verify Your Email</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We've sent a 6-digit verification code to<br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-4 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100"
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {timeLeft > 0 ? (
              <p>Code expires in <span className="font-semibold text-red-600">{formatTime(timeLeft)}</span></p>
            ) : (
              <p className="text-red-600">Code has expired</p>
            )}
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="font-medium text-primary dark:text-accent hover:text-primary-hover dark:hover:text-accent-hover inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Resend Code
                </button>
              ) : (
                <span className="text-gray-400">Resend available in {formatTime(timeLeft)}</span>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTPPage;