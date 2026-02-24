import React from 'react';
import { BookOpen, Home, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">Explore services and opportunities</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <div className="bg-accent/20 p-2.5 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary dark:text-accent" />
                </div>
                <h3 className="text-base font-semibold text-primary dark:text-gray-100 ml-3">Education Programs</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 text-sm mb-4">
                Discover courses, request study materials and track your requests
              </p>
              <Button className="w-full" onClick={() => navigate('/education-programs')}>
                Browse Programs
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg">
                  <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base font-semibold text-primary dark:text-gray-100 ml-3">Accommodation</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 text-sm mb-4">Find student housing near campus</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">Find Housing</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <div className="bg-accent/20 p-2.5 rounded-lg">
                  <Store className="h-6 w-6 text-primary dark:text-accent" />
                </div>
                <h3 className="text-base font-semibold text-primary dark:text-gray-100 ml-3">Campus Shops</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 text-sm mb-4">Explore local businesses and services</p>
              <Button className="w-full">Browse Shops</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
