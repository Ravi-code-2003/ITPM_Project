const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    requireTLS: process.env.EMAIL_REQUIRE_TLS === "true",
    authMethod: process.env.EMAIL_AUTH_METHOD || undefined,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `"Student Connect" <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

// Send OTP email template
const sendOTPEmail = async (email, otp, fullName) => {
  const subject = "Password Reset OTP - Student Connect";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1>Student Connect</h1>
      </div>
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2>Password Reset Request</h2>
        <p>Hello ${fullName},</p>
        <p>We received a request to reset your password for your Student Connect account.</p>
        <p>Your OTP code is:</p>
        <div style="background-color: #e5e7eb; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>Student Connect Team</p>
      </div>
      <div style="background-color: #374151; color: white; padding: 15px; text-align: center;">
        <p style="margin: 0;">© 2026 Student Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({ email, subject, html });
};

// Send approval email template
const sendApprovalEmail = async (email, fullName, role) => {
  const subject = "Account Approved - Student Connect";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
        <h1>Student Connect</h1>
      </div>
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2>🎉 Account Approved!</h2>
        <p>Hello ${fullName},</p>
        <p>Congratulations! Your ${role} account has been approved by our admin team.</p>
        <p>You can now log in to your account and access all features.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Login Now
          </a>
        </div>
        <p>Welcome to the Student Connect community!</p>
        <p>Best regards,<br>Student Connect Team</p>
      </div>
      <div style="background-color: #374151; color: white; padding: 15px; text-align: center;">
        <p style="margin: 0;">© 2026 Student Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({ email, subject, html });
};

// Send rejection email template
const sendRejectionEmail = async (email, fullName, role) => {
  const subject = "Account Registration Update - Student Connect";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
        <h1>Student Connect</h1>
      </div>
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2>Registration Update</h2>
        <p>Hello ${fullName},</p>
        <p>We regret to inform you that your ${role} account registration has been rejected by our admin team.</p>
        <p>This could be due to:</p>
        <ul>
          <li>Incomplete or invalid documentation</li>
          <li>Information verification issues</li>
          <li>Policy compliance concerns</li>
        </ul>
        <p>If you believe this is an error or would like to reapply, please contact our support team.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" 
             style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Contact Support
          </a>
        </div>
        <p>Thank you for your interest in Student Connect.</p>
        <p>Best regards,<br>Student Connect Team</p>
      </div>
      <div style="background-color: #374151; color: white; padding: 15px; text-align: center;">
        <p style="margin: 0;">© 2026 Student Connect. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({ email, subject, html });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};