// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiry time (5 minutes from now)
const getOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};

// Check if OTP is expired
const isOTPExpired = (otpExpire) => {
  return new Date() > otpExpire;
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
};