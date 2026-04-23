import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 bg-white/90 dark:bg-surface-dark/90 shadow-xl overflow-hidden">
          <div className="p-5 sm:p-7 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_42%)]">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Get in Touch</h1>
                <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Have questions or need support? Reach out and our team will help you quickly.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Support Window</p>
                    <p className="mt-1 text-2xl font-extrabold text-primary dark:text-gray-100">24h</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Contact Channels</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">3</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Response Priority</p>
                    <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-300">Student</p>
                  </div>
                </div>
              </div>

              <div className="xl:w-[360px] rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-slate-900/40 p-4 sm:p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Need quick help?</p>
                <h3 className="mt-2 font-semibold text-primary dark:text-gray-100 leading-snug">Share your issue details clearly</h3>
                <p className="text-xs text-secondary dark:text-gray-300 mt-2">
                  Include your account email and context so our team can resolve your request faster.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-soft-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-primary dark:text-accent" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                  placeholder="What can we help you with?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 resize-none"
                  placeholder="Please describe your question or feedback..."
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                size="lg"
                icon={isSubmitting ? null : <Send className="h-5 w-5" />}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="shadow-soft-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-primary dark:text-accent mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-primary dark:text-gray-100">Email</h3>
                      <p className="text-gray-600 dark:text-gray-300">support@unicore.com</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We'll respond within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-6 w-6 text-primary dark:text-accent mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-primary dark:text-gray-100">Phone</h3>
                      <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mon-Fri, 9AM-6PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-primary dark:text-accent mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-primary dark:text-gray-100">Address</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        123 University Avenue<br />
                        Campus District<br />
                        City, State 12345
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="!bg-primary dark:!bg-primary text-white shadow-soft-xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-white">Quick Questions?</h2>
                <p className="text-white/90 mb-6">
                  Check out our FAQ section for instant answers to common questions about registration, 
                  approval process, and using our platform.
                </p>
                <Button size="lg" variant="secondary" className="text-lg">
                  View FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;