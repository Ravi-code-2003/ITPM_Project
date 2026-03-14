import React, { useEffect, useState } from "react";
import { Heart, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import FavoritesPage from "../../components/student/FavoritesPage";
import OrderHistory from "../../components/student/OrderHistory";
import CartPage from "../../components/student/CartPage";
import TodoTable from "../../components/notes/TodoTable";
import LostFoundSection from "../../components/lostfound/LostFoundSection";
import api from "../../services/api";
import { useCart } from "../../contexts/CartContext";
import toast from "react-hot-toast";

const StudentDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("favorites");
  const [dashboardDataLoading, setDashboardDataLoading] = useState(true);
  const [topRatedFoods, setTopRatedFoods] = useState([]);
  const { getCartCount } = useCart();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["favorites", "cart", "orders"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTopRatedFoods();
  }, []);

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

  const tabs = [
    { id: "favorites", label: "My Favorites", icon: Heart },
    { id: "cart", label: "Shopping Cart", icon: ShoppingCart, count: getCartCount() },
    { id: "orders", label: "Order History", icon: ShoppingBag },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "favorites":
        return <FavoritesPage />;
      case "cart":
        return <CartPage />;
      case "orders":
        return <OrderHistory />;
      default:
        return <FavoritesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">
            Manage your favorites, shopping cart and track your food orders
          </p>
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

        {renderTabContent()}
      </div>
    </div>
  );
};

export default StudentDashboard;
