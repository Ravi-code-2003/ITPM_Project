import React from 'react';
import { Shield, AlertTriangle, Mail, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const AccountRestricted = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft-lg p-8 text-center">
          <div className="bg-red-100 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">
            Account Access Restricted
          </h1>
          
          <p className="text-secondary dark:text-gray-400 mb-6">
            Your account has been temporarily restricted due to a policy violation or security concern.
          </p>
          
          <div className="bg-accent/20 dark:bg-accent/10 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-primary dark:text-accent mt-1 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-2">Common reasons for restriction:</h3>
                <ul className="text-sm text-primary dark:text-gray-200 space-y-1">
                  <li>• Violation of community guidelines</li>
                  <li>• Suspicious account activity</li>
                  <li>• Incomplete or false information</li>
                  <li>• Multiple failed verification attempts</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-accent/20 dark:bg-accent/10 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-primary dark:text-accent mr-3" />
              <div className="text-left">
                <h3 className="font-semibold text-primary dark:text-gray-100">Need to appeal?</h3>
                <p className="text-sm text-primary dark:text-gray-200">Contact our support team for assistance</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link to="/contact">
              <Button className="w-full">
                Contact Support
              </Button>
            </Link>
            <Link to="/" className="inline-flex items-center justify-center text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-accent transition duration-300">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountRestricted;