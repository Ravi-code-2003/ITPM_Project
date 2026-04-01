import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationBell from './NotificationBell';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  Home,
  BookOpen,
  Phone,
  Info,
  ChevronDown,
  UtensilsCrossed,
  Building2,
  MessageSquare,
  ShoppingCart
} from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      student: '/student/dashboard',
      'shop-owner': '/shop-owner/dashboard',
      'house-owner': '/house-owner/dashboard',
      'education-path': '/education-path/dashboard',
    };

    return dashboardRoutes[user.role] || '/dashboard';
  };

  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) {
      if (path.includes('admin')) return 'Admin Dashboard';
      if (path.includes('student')) return 'Student Dashboard';
      if (path.includes('shop-owner')) return 'Shop Owner Dashboard';
      if (path.includes('house-owner')) return 'House Owner Dashboard';
      if (path.includes('education-path')) return 'Education Provider Dashboard';
      return 'Dashboard';
    }
    return null;
  };

  const isDashboardPage = location.pathname.includes('dashboard');

  const publicNavItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Education', href: '/education-programs', icon: BookOpen },
    { name: 'Restaurants', href: '/restaurants', icon: UtensilsCrossed },
    { name: 'Accommodation', href: '/accommodation', icon: Building2 },
    { name: 'Contact', href: '/contact', icon: Phone },
  ];

  return (
    <header className="bg-surface dark:bg-surface-dark shadow-soft border-b border-secondary/20 dark:border-secondary/10 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-primary dark:text-gray-100">Student Connect</span>
                {isDashboardPage && getCurrentPageName() && (
                  <div className="text-xs text-secondary dark:text-gray-400">
                    {getCurrentPageName()}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Show for non-authenticated users and students */}
          {(!isAuthenticated || (isAuthenticated && user?.role === 'student')) && (
            <nav className="hidden md:flex items-center space-x-10 lg:space-x-12">
              {publicNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-colors duration-200 font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <ThemeToggle />

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-primary dark:text-gray-200 hover:text-primary-hover dark:hover:text-accent focus:outline-none px-3 py-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200"
                  >
                    <div className="bg-gradient-to-br from-primary to-primary/80 p-1.5 rounded-full shadow-sm">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{user?.fullName}</div>
                      <div className="text-xs text-secondary dark:text-gray-400 capitalize">
                        {user?.role?.replace('-', ' ')}
                      </div>
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-full">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{user?.fullName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {user?.role?.replace('-', ' ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to={getDashboardLink()}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3 text-gray-500" />
                          Dashboard
                        </Link>
                        <Link
                          to="/ai-chat"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <MessageSquare className="h-4 w-4 mr-3 text-gray-500" />
                          AI Assistant
                        </Link>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <NotificationBell />

                {/* Cart Icon for Students */}
                {user?.role === 'student' && (
                  <Link
                    to="/student/cart"
                    className="relative flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-all duration-200 p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 group"
                    title="Shopping Cart"
                  >
                    <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    {getCartCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                        {getCartCount() > 99 ? '99+' : getCartCount()}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link to="/register">
                  <Button className="px-4 py-2 text-sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Cart Icon for Students on Mobile */}
            {isAuthenticated && user?.role === 'student' && (
              <Link
                to="/student/cart"
                className="relative flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-all duration-200 p-2 rounded-lg hover:bg-primary/10"
                title="Shopping Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {getCartCount() > 9 ? '9+' : getCartCount()}
                  </span>
                )}
              </Link>
            )}
            {isAuthenticated && <NotificationBell />}
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-accent focus:outline-none transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-secondary/20 dark:border-secondary/10 py-4">
            <div className="flex flex-col space-y-3">
              {(!isAuthenticated || (isAuthenticated && user?.role === 'student')) && (
                <>
                  {publicNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent px-2 py-2 rounded-md transition-colors duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  {/* Cart Link for Students in Mobile */}
                  {isAuthenticated && user?.role === 'student' && (
                    <Link
                      to="/student/cart"
                      className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 text-primary dark:text-accent px-3 py-2 rounded-lg transition-colors hover:bg-primary/10 dark:hover:bg-primary/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="font-medium">Cart</span>
                      </div>
                      {getCartCount() > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {getCartCount() > 9 ? '9+' : getCartCount()}
                        </span>
                      )}
                    </Link>
                  )}
                </>
              )}
              
              {isAuthenticated ? (
                <div className="border-t border-secondary/20 dark:border-secondary/10 pt-3 mt-3">
                  {/* Student Profile Info */}
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-full">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary dark:text-gray-100">{user?.fullName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {user?.role?.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Access Buttons for Mobile */}
                  <div className="space-y-2">
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link
                      to="/ai-chat"
                      className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">AI Assistant</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-secondary/20 dark:border-secondary/10 pt-3 mt-3 space-y-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block"
                  >
                    <Button className="w-full justify-center">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;
