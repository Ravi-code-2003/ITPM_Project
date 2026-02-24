import React from 'react';
import { Clock, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft-lg p-8 text-center">
          <div className="bg-accent/20 dark:bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-primary dark:text-accent" />
          </div>
          
          <h1 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">
            Application Under Review
          </h1>
          
          <p className="text-secondary dark:text-gray-400 mb-6">
            Thank you for registering with UniCore! Your application is currently being reviewed by our admin team.
          </p>
          
          <div className="bg-accent/20 dark:bg-accent/10 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-primary dark:text-accent mt-1 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-2">What happens next?</h3>
                <ul className="text-sm text-primary dark:text-gray-200 space-y-1">
                  <li>• Admin reviews your submitted documents</li>
                  <li>• Verification of your credentials</li>
                  <li>• Approval notification via email</li>
                  <li>• Account activation and dashboard access</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center text-sm text-secondary dark:text-gray-400 mb-6">
            <CheckCircle className="h-4 w-4 mr-2" />
            Typical review time: 1-3 business days
          </div>
          
          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full">
                Return to Home
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;