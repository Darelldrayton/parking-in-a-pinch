import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingsProvider } from './context/BookingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeModeProvider } from './hooks/useThemeMode';
import Layout from './components/layout/Layout';
import notificationService from './services/notifications';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
// DevHelper removed for production security
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Listings = lazy(() => import('./pages/Listings'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const MyListings = lazy(() => import('./pages/MyListings'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingForm = lazy(() => import('./pages/BookingForm'));
const Checkout = lazy(() => import('./pages/Checkout'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const Messages = lazy(() => import('./pages/Messages'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Earnings = lazy(() => import('./pages/Earnings'));
const Payout = lazy(() => import('./pages/Payout'));
const Reviews = lazy(() => import('./pages/Reviews'));
const HostBookings = lazy(() => import('./pages/HostBookings'));
const RecurringBookings = lazy(() => import('./pages/RecurringBookings'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
// Test pages removed for production security

// Footer Pages
const AboutUs = lazy(() => import('./pages/AboutUs'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Careers = lazy(() => import('./pages/Careers'));
const Press = lazy(() => import('./pages/Press'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Safety = lazy(() => import('./pages/Safety'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const BecomeHost = lazy(() => import('./pages/BecomeHost'));
const HostGuidelines = lazy(() => import('./pages/HostGuidelines'));
const HostInsurance = lazy(() => import('./pages/HostInsurance'));
const HostResources = lazy(() => import('./pages/HostResources'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(module => {
  console.log('🆕 AdminLogin lazy loaded - new version');
  return module;
}));
const AdminDashboard = lazy(() => import('./pages/AdminDashboardEnhanced').catch(() => import('./pages/AdminDashboardSimple')));
const AdminJobApplications = lazy(() => import('./pages/AdminJobApplications'));
// 🚨 FORCE CACHE CLEAR - BUILD v2025-01-02-20:42 PST
const AdminProtectedRoute = lazy(() => import('./components/auth/AdminProtectedRoute'));

// Keep cleanup-listings for admin use only
const CleanupListings = lazy(() => import('./pages/CleanupListings'));
const ClearAllListings = lazy(() => import('./pages/ClearAllListings'));

// 🛑 ROUTING FIXED v10.0: 2024-12-30 20:19 PST - EXPLICIT IMPORT FIX

// Loading component
const PageLoader = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    bgcolor="#f5f5f5"
  >
    <CircularProgress size={60} sx={{ mb: 2 }} />
    <Typography variant="h6" >
      Loading Parking in a Pinch...
    </Typography>
  </Box>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Admin Routes Component (bypasses regular auth)
function AdminRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute redirectTo="/admin/login"><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/job-applications" element={<AdminProtectedRoute redirectTo="/admin/login"><AdminJobApplications /></AdminProtectedRoute>} />
        <Route path="/admin/cleanup-listings" element={<AdminProtectedRoute redirectTo="/admin/login"><CleanupListings /></AdminProtectedRoute>} />
        <Route path="/admin/clear-all-listings" element={<AdminProtectedRoute redirectTo="/admin/login"><ClearAllListings /></AdminProtectedRoute>} />
        {/* Fallback for unmatched admin routes */}
        <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Suspense>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  // Don't initialize notifications on admin pages
  const isAdminPage = window.location.pathname.includes('/admin');

  // Initialize notification service when user is authenticated (but not on admin pages)
  useEffect(() => {
    if (isAuthenticated && !isAdminPage) {
      notificationService.initialize();
    }
  }, [isAuthenticated, isAdminPage]);

  // If this is an admin page, use separate admin routing
  if (isAdminPage) {
    return <AdminRoutes />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Layout><Listings /></Layout>} />
        <Route path="/listings/:id" element={<Layout><ListingDetail /></Layout>} />
        
        
        {/* Auth Routes (redirect to dashboard if already logged in) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />
        <Route 
          path="/reset-password/:uid/:token" 
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-listing" 
          element={
            <ProtectedRoute>
              <Layout><CreateListing /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-listings" 
          element={
            <ProtectedRoute>
              <Layout><MyListings /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bookings" 
          element={
            <ProtectedRoute>
              <Layout><MyBookings /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/book/:id" 
          element={
            <ProtectedRoute>
              <Layout><BookingForm /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Layout><Checkout /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-bookings" 
          element={
            <ProtectedRoute>
              <Layout><MyBookings /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booking/:id" 
          element={
            <ProtectedRoute>
              <Layout><BookingDetail /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Layout><Messages /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute>
              <Layout><Favorites /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/earnings" 
          element={
            <ProtectedRoute>
              <Layout><Earnings /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payout" 
          element={
            <ProtectedRoute>
              <Layout><Payout /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reviews" 
          element={
            <ProtectedRoute>
              <Layout><Reviews /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/host-bookings" 
          element={
            <ProtectedRoute>
              <Layout><HostBookings /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recurring-bookings" 
          element={
            <ProtectedRoute>
              <Layout><RecurringBookings /></Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Footer Pages - Company */}
        <Route path="/about" element={<Layout><AboutUs /></Layout>} />
        <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
        <Route path="/careers" element={<Layout><Careers /></Layout>} />
        <Route path="/press" element={<Layout><Press /></Layout>} />
        
        {/* Footer Pages - Support */}
        <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
        <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
        <Route path="/safety" element={<Layout><Safety /></Layout>} />
        <Route path="/community-guidelines" element={<Layout><CommunityGuidelines /></Layout>} />
        
        {/* Footer Pages - Legal */}
        <Route path="/terms" element={<Layout><TermsAndConditions /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
        <Route path="/accessibility" element={<Layout><Accessibility /></Layout>} />
        
        {/* Footer Pages - For Hosts */}
        <Route path="/become-host" element={<Layout><BecomeHost /></Layout>} />
        <Route path="/host-guidelines" element={<Layout><HostGuidelines /></Layout>} />
        <Route path="/host-insurance" element={<Layout><HostInsurance /></Layout>} />
        <Route path="/host-resources" element={<Layout><HostResources /></Layout>} />
        
        {/* Admin Routes moved to separate AdminRoutes component */}
        
        {/* Production routes only - test routes removed for security */}
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  // console.log('🚀 App component rendering - v2025-01-02-20:42-PST...');
  // console.log('Current path:', window.location.pathname);
  // console.log('🎯 Routes available: /admin/login, /admin/dashboard, /admin/cleanup-listings');
  // console.log('🔄 CACHE CLEARED - NEW BUILD FORCED...');
  
  // Completely disable notifications and WebSocket on admin pages
  const isAdminPage = window.location.pathname.includes('/admin');
  
  if (isAdminPage) {
    // console.log('🔒 ADMIN PAGE DETECTED - DISABLING WEBSOCKET AND NOTIFICATIONS');
    // Disable WebSocket globally for admin pages
    (window as any).disableWebSocket = true;
  }
  
  return (
    <ThemeModeProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider 
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          autoHideDuration={4000}
        >
          <AuthProvider>
            {!isAdminPage ? (
              <NotificationProvider>
                <BookingsProvider>
                  <Router>
                    <AppRoutes />
                  </Router>
                </BookingsProvider>
              </NotificationProvider>
            ) : (
              <BookingsProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </BookingsProvider>
            )}
          </AuthProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeModeProvider>
  );
}

export default App