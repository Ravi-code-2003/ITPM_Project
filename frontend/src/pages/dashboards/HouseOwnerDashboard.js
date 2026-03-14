import React from 'react';
import { Home, Users, DollarSign, Calendar } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const HouseOwnerDashboard = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">House Owner Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">Manage your property and tenants</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Property Views</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">189</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Home className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Inquiries</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">23</p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Monthly Rent</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">LKR 1,200</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Occupancy</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">85%</p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Calendar className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Property Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary dark:text-gray-400">Property management tools will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HouseOwnerDashboard;
