import React, { useEffect, useState } from "react";
import {
  Calendar,
  Heart,
  ShoppingBag,
  DollarSign,
  Star,
  Utensils,
  ShoppingCart,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/Card";
import FavoritesPage from "../../components/student/FavoritesPage";
import OrderHistory from "../../components/student/OrderHistory";
import CartPage from "../../components/student/CartPage";
import TodoTable from "../../components/notes/TodoTable";
import LostFoundSection from "../../components/lostfound/LostFoundSection";
import AddNoteButton from "../../components/notes/AddNoteButton";
import BudgetSummary from "../../components/budget/BudgetSummary";
import MealPlan from "../../components/budget/MealPlan";
import Suggestions from "../../components/budget/Suggestions";
import Insights from "../../components/budget/Insights";
import api, { budgetAPI } from "../../services/api";
import { useCart } from "../../contexts/CartContext";
import toast from "react-hot-toast";
import { BookOpen, Home, Store, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Home, MapPin, Store, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomRequestService } from '../../services/accommodationService';

const normalizeRequests = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object');
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCartCount } = useCart();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalOrders: 0,
    monthlySpent: 0,
    favoriteRestaurants: 0,
    currentOffers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(true);
  const [topRatedFoods, setTopRatedFoods] = useState([]);
  const [budgetRefreshTick, setBudgetRefreshTick] = useState(0);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const allowedTabs = ["overview", "favorites", "cart", "orders", "budget"];
    if (tabParam && allowedTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, favoritesRes, offersRes, budgetRes] = await Promise.allSettled([
        api.get("/student/orders?limit=3", { timeout: 20000 }),
        api.get("/student/favorites", { timeout: 20000 }),
        api.get("/student/offers", { timeout: 20000 }),
        budgetAPI.getSummary(),
      ]);

      const ordersData = ordersRes.status === "fulfilled" ? ordersRes.value?.data : null;
      const favoritesData =
        favoritesRes.status === "fulfilled" ? favoritesRes.value?.data : null;
      const offersData = offersRes.status === "fulfilled" ? offersRes.value?.data : null;
      const budgetData = budgetRes.status === "fulfilled" ? budgetRes.value?.data : null;

      setStats({
        totalOrders: ordersData?.pagination?.totalOrders || 0,
        monthlySpent: budgetData?.totalSpent || 0,
        favoriteRestaurants: favoritesData?.favorites?.length || 0,
        currentOffers: offersData?.offers?.length || 0,
      });

      if (ordersData?.orders) {
        setRecentOrders(ordersData.orders);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopRatedFoods = async () => {
    try {
      setDashboardDataLoading(true);
      const restaurantsResponse = await api.get("/student/restaurants");
      const ranked = (restaurantsResponse.data.restaurants || [])
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 5);
      setTopRatedFoods(ranked);
    } catch (error) {
      toast.error("Failed to load top rated foods");
      console.error("Error loading top rated foods:", error);
    } finally {
      setDashboardDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      fetchStats();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTopRatedFoods();
  }, []);

  useEffect(() => {
    if (activeTab !== "budget") return undefined;
    const intervalId = setInterval(() => {
      setBudgetRefreshTick((tick) => tick + 1);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  const [requests, setRequests] = useState([]);
  const [roomLoading, setRoomLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await roomRequestService.getStudentRequests();
        setRequests(normalizeRequests(response.data));
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setRoomLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'ACCEPTED') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Calendar },
    { id: "favorites", label: "My Favorites", icon: Heart },
    {
      id: "cart",
      label: "Shopping Cart",
      icon: ShoppingCart,
      count: getCartCount(),
    },
    { id: "orders", label: "Order History", icon: ShoppingBag },
    { id: "budget", label: "Budget Manager", icon: DollarSign },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.totalOrders}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary dark:text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    LKR {stats.monthlySpent.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary dark:text-gray-400">Favorite Places</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.favoriteRestaurants}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-secondary dark:text-gray-400">Active Offers</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.currentOffers}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => navigate("/restaurants")}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Utensils className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Find Food</h3>
                  </div>
                  <Button className="w-full">Browse Restaurants</Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => navigate("/restaurants")}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                      <Star className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Special Offers</h3>
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">View Offers</Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("budget")}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Budget Manager</h3>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Open Budget Manager</Button>
                </CardContent>
              </Card>
            </div>

            {recentOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest food orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-primary dark:text-gray-100">{order.restaurantId?.shopName || 'Restaurant'}</p>
                          <p className="text-sm text-secondary dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()} • {order.status}
                          </p>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          LKR {order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "favorites":
        return <FavoritesPage />;
      case "cart":
        return <CartPage />;
      case "orders":
        return <OrderHistory />;
      case "budget":
        return (
          <div className="space-y-4">
            <BudgetSummary
              refreshTick={budgetRefreshTick}
              onBudgetUpdated={() => setBudgetRefreshTick((tick) => tick + 1)}
            />
            <MealPlan refreshTick={budgetRefreshTick} />
            <Suggestions refreshTick={budgetRefreshTick} />
            <Insights refreshTick={budgetRefreshTick} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary dark:text-gray-100">
                Student Dashboard
              </h1>
              <p className="text-secondary dark:text-gray-400 mt-2">
                Manage your favorites, shopping cart, budget, and track your food orders
              </p>
            </div>
            <AddNoteButton />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Top Rated Foods
              </CardTitle>
              <CardDescription>Highest-rated food places for students</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardDataLoading ? (
                <p className="text-sm text-secondary dark:text-gray-400">Loading top rated foods...</p>
              ) : topRatedFoods.length === 0 ? (
                <p className="text-sm text-secondary dark:text-gray-400">No rated food places yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Food Place</th>
                        <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Location</th>
                        <th className="text-left py-2 pr-3 font-semibold text-primary dark:text-gray-100">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRatedFoods.map((item) => (
                        <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 pr-3 text-secondary dark:text-gray-300">{item.shopName}</td>
                          <td className="py-2 pr-3 text-secondary dark:text-gray-300">{item.location}</td>
                          <td className="py-2 pr-3 text-secondary dark:text-gray-300">
                            {(item.averageRating || 0).toFixed(1)} ({item.totalRatings || 0})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <TodoTable />
            </CardContent>
          </Card>

          <LostFoundSection />
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative ${
                      activeTab === tab.id
                        ? "border-primary text-primary dark:text-primary-light"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {tab.count > 99 ? "99+" : tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {loading && activeTab === "overview" ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : (
          renderTabContent()
        )}

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
              <p className="text-secondary dark:text-gray-400 mb-4">Discover courses and learning opportunities</p>
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
              <p className="text-secondary dark:text-gray-400 mb-4">Find student housing near campus</p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                onClick={() => navigate('/accommodation')}
              >
                Find Housing
              </Button>
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
              <p className="text-secondary dark:text-gray-400 mb-4">Explore local businesses and services</p>
              <Button className="w-full" onClick={() => navigate('/restaurants')}>
                Browse Shops
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : requests.length === 0 ? (
              <p className="text-secondary dark:text-gray-400">Your recent activity and recommendations will appear here.</p>
            ) : (
              <div className="space-y-4">
                {normalizeRequests(requests).slice(0, 5).map((request, index) => (
                  <div
                    key={request._id || `request-${index}`}
                    className="flex items-start gap-4 p-4 rounded-lg border border-secondary/20 dark:border-gray-700 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-primary dark:text-gray-100 truncate">
                          {request.room?.title || 'Room Inquiry'}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      {request.room?.location?.area && (
                        <div className="flex items-center text-sm text-secondary dark:text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          {request.room.location.area}
                        </div>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.responseMessage && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Owner: "{request.ownerResponse.responseMessage}"
                        </p>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.availableVisitingTimes && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Visiting times: {request.ownerResponse.availableVisitingTimes}
                        </p>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.preferredContactMethod && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Contact via: {request.ownerResponse.preferredContactMethod}
                        </p>
                      )}
                      <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
                {requests.length > 5 && (
                  <p className="text-sm text-secondary dark:text-gray-400 text-center pt-2">
                    And {requests.length - 5} more inquiry{requests.length - 5 > 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
