import React from 'react';
import { BookOpen, Home, Store, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
            <p className="text-secondary dark:text-gray-400 mt-2">Explore services and opportunities</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-accent/20 p-3 rounded-lg">
                  <BookOpen className="h-8 w-8 text-primary dark:text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Education Programs</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 mb-4">Discover courses and learning opportunities</p>
              <Button className="w-full">
                Browse Programs
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Home className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Accommodation</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 mb-4">Find student housing near campus</p>
              <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
                Find Housing
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Store className="h-8 w-8 text-primary dark:text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Campus Shops</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 mb-4">Explore local businesses and services</p>
              <Button className="w-full">
                Browse Shops
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary dark:text-gray-400">Your recent activity and recommendations will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;