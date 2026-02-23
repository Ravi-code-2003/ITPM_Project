import React from 'react';
import { Store, Users, BarChart, Package } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

const ShopOwnerDashboard = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Shop Owner Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">Manage your business and connect with students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Shop Views</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">342</p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Store className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Student Visits</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">128</p>
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
                  <p className="text-sm text-secondary dark:text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">$2,456</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <BarChart className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Products</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">45</p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Package className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary dark:text-gray-400">Shop management tools will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;