import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { ProtectedRoute, PublicRoute, AdminRoute, RoleRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import FloatingAIChat from './components/chat/FloatingAIChat';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import EducationProgramsPage from './pages/EducationProgramsPage';
import RestaurantsPage from './pages/RestaurantsPage';
import AccommodationPage from './pages/AccommodationPage';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentRegister from './pages/StudentRegister';
import ShopOwnerRegister from './pages/auth/ShopOwnerRegister';
import HouseOwnerRegister from './pages/auth/HouseOwnerRegister';
import EducationProviderRegister from './pages/auth/EducationProviderRegister';

// Password Reset Pages
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import ShopOwnerDashboard from './pages/dashboards/ShopOwnerDashboard';
import HouseOwnerDashboard from './pages/dashboards/HouseOwnerDashboard';
import EducationProviderDashboard from './pages/dashboards/EducationProviderDashboard';
import AIChatPage from './pages/AIChatPage';

// Student Components  
import RestaurantDetail from './components/student/RestaurantDetail';
import CartPage from './components/student/CartPage';

// Status Pages
import PendingApproval from './pages/status/PendingApproval';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
        <Router>
          <div className="min-h-screen bg-background dark:bg-background-dark transition-colors duration-200">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <Layout>
                  <LandingPage />
                </Layout>
              } 
            />
            <Route 
              path="/about" 
              element={
                <Layout>
                  <AboutPage />
                </Layout>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <Layout>
                  <ContactPage />
                </Layout>
              } 
            />
            <Route 
              path="/education-programs" 
              element={
                <Layout>
                  <EducationProgramsPage />
                </Layout>
              } 
            />
            <Route 
              path="/restaurants" 
              element={
                <Layout>
                  <RestaurantsPage />
                </Layout>
              } 
            />
            <Route 
              path="/accommodation" 
              element={
                <Layout>
                  <AccommodationPage />
                </Layout>
              } 
            />

            {/* Auth Routes - Redirect if already logged in */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />

            {/* Registration Routes by Role */}
            <Route 
              path="/register/student" 
              element={
                <PublicRoute>
                  <StudentRegister />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register/shop-owner" 
              element={
                <PublicRoute>
                  <ShopOwnerRegister />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register/house-owner" 
              element={
                <PublicRoute>
                  <HouseOwnerRegister />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register/education-path" 
              element={
                <PublicRoute>
                  <EducationProviderRegister />
                </PublicRoute>
              } 
            />

            {/* Password Reset Routes */}
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/verify-otp" 
              element={
                <PublicRoute>
                  <VerifyOTPPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              } 
            />

            {/* Dashboard Routes - Role-based access */}
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <Layout showFooter={false}>
                    <AdminDashboard />
                  </Layout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/student/dashboard" 
              element={
                <RoleRoute roles={['student']}>
                  <Layout showFooter={false}>
                    <StudentDashboard />
                  </Layout>
                </RoleRoute>
              } 
            />
            <Route 
              path="/student/restaurant/:id" 
              element={
                <RoleRoute roles={['student']}>
                  <Layout showFooter={false}>
                    <RestaurantDetail />
                  </Layout>
                </RoleRoute>
              } 
            />
            <Route 
              path="/student/cart" 
              element={
                <RoleRoute roles={['student']}>
                  <Layout showFooter={false}>
                    <CartPage />
                  </Layout>
                </RoleRoute>
              } 
            />
            <Route 
              path="/shop-owner/dashboard" 
              element={
                <RoleRoute roles={['shop-owner']} requireApproval={true}>
                  <Layout showFooter={false}>
                    <ShopOwnerDashboard />
                  </Layout>
                </RoleRoute>
              } 
            />
            <Route 
              path="/house-owner/dashboard" 
              element={
                <RoleRoute roles={['house-owner']} requireApproval={true}>
                  <Layout showFooter={false}>
                    <HouseOwnerDashboard />
                  </Layout>
                </RoleRoute>
              } 
            />
            <Route 
              path="/education-path/dashboard" 
              element={
                <RoleRoute roles={['education-path']} requireApproval={true}>
                  <Layout showFooter={false}>
                    <EducationProviderDashboard />
                  </Layout>
                </RoleRoute>
              } 
            />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <AIChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Status Pages */}
            <Route 
              path="/pending-approval" 
              element={
                <ProtectedRoute requireApproval={false}>
                  <Layout>
                    <PendingApproval />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/unauthorized" 
              element={
                <Layout>
                  <UnauthorizedPage />
                </Layout>
              } 
            />

            {/* Catch all - 404 */}
            <Route 
              path="*" 
              element={
                <Layout>
                  <NotFoundPage />
                </Layout>
              } 
            />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#2A3048',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#CFC6A8',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <FloatingAIChat />
          </div>
        </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
