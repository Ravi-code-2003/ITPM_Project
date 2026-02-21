import React from 'react';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="bg-accent/20 dark:bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-10 w-10 text-primary dark:text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-primary dark:text-gray-100 mb-4">
            403
          </h1>
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-4">
            Access Denied
          </h2>
          <p className="text-secondary dark:text-gray-400 mb-8">
            Sorry, you don't have permission to access this page. This area is restricted to authorized users only.
          </p>
        </div>

        <div className="bg-accent/20 dark:bg-accent/10 border border-secondary/20 dark:border-secondary/10 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary dark:text-gray-100">Need access?</h3>
              <p className="text-sm text-primary dark:text-gray-200 mt-1">
                If you believe you should have access to this page, please contact your administrator or check that you're signed in with the correct account.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </Button>
          
          <Link to="/">
            <Button className="w-full flex items-center justify-center">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>

          <Link
            to="/login"
            className="block w-full text-center text-primary dark:text-accent hover:text-primary/80 dark:hover:text-accent/80 font-medium"
          >
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;