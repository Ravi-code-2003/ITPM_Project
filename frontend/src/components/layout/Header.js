import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';
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
  Building2
} from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-primary dark:text-gray-100">UniCore</span>
                {isDashboardPage && getCurrentPageName() && (
                  <div className="text-xs text-secondary dark:text-gray-400">
                    {getCurrentPageName()}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Only show for non-authenticated users */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-8">
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
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center">
                {/* User Info Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-primary dark:text-gray-200 hover:text-primary-hover dark:hover:text-accent focus:outline-none p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors duration-200"
                  >
                    <div className="bg-accent/20 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary dark:text-accent" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{user?.fullName}</div>
                      <div className="text-xs text-secondary dark:text-gray-400 capitalize">
                        {user?.role?.replace('-', ' ')}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface dark:bg-surface-dark rounded-xl shadow-soft-lg py-2 border border-secondary/20 dark:border-secondary/10 z-50">
                      <div className="px-4 py-2 border-b border-secondary/20 dark:border-secondary/10">
                        <div className="font-medium text-primary dark:text-gray-100">{user?.fullName}</div>
                        <div className="text-sm text-secondary dark:text-gray-400 capitalize">
                          {user?.role?.replace('-', ' ')}
                        </div>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center px-4 py-3 text-sm text-secondary dark:text-gray-300 hover:bg-accent/10 hover:text-primary dark:hover:text-accent transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-primary dark:text-accent" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-secondary dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-3 text-red-600" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent font-semibold transition-colors duration-200"
                >
                  Login
                </Link>
                <Link to="/register">
                  <Button>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-accent focus:outline-none transition-colors duration-200"
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
              {!isAuthenticated && (
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
                </>
              )}
              
              {isAuthenticated ? (
                <div className={`${!isAuthenticated ? 'border-t border-secondary/20 dark:border-secondary/10 pt-3 mt-3' : ''}`}>
                  <div className="flex items-center space-x-2 px-2 py-2 mb-3">
                    <div className="bg-accent/20 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary dark:text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-primary dark:text-gray-100">{user?.fullName}</div>
                      <div className="text-sm text-secondary dark:text-gray-400 capitalize">
                        {user?.role?.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Access Buttons for Mobile */}
                  <div className="grid grid-cols-2 gap-2 mb-3 px-2">
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center justify-center space-x-1 bg-accent/20 text-primary dark:text-accent py-2 rounded-md hover:bg-accent/30 transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-secondary/20 dark:border-secondary/10 pt-3 mt-3 flex flex-col space-y-2">
                  <Link
                    to="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent px-2 py-2 rounded-md transition-colors duration-200 font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full text-center">
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