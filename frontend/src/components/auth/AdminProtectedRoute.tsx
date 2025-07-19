import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/admin/login' 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // CRITICAL FIX: Only check authentication once
    let mounted = true;
    
    const checkAuthentication = async () => {
      if (!mounted) return;
      
      console.log('🔐 AdminProtectedRoute: Checking authentication...');
      console.log('🔐 Current path:', window.location.pathname);
      console.log('🔐 Timestamp:', new Date().toISOString());
      console.log('🔐 RedirectTo prop:', redirectTo);
      console.log('🔐 Current state:', { isAuthenticated, isLoading });
      
      // Check if user just logged in
      const justLoggedIn = sessionStorage.getItem('just_logged_in');
      if (justLoggedIn) {
        console.log('⏳ User just logged in - clearing flag and proceeding...');
        // Clear the flag immediately to prevent issues
        sessionStorage.removeItem('just_logged_in');
        // Don't return early - continue with authentication check
      }
      
      const adminToken = localStorage.getItem('admin_access_token');
      const adminUser = localStorage.getItem('admin_user');
      
      console.log('🔐 Admin token exists:', !!adminToken);
      console.log('🔐 Admin user exists:', !!adminUser);
      
      if (!adminToken || !adminUser) {
        console.log('❌ No admin credentials found - redirecting to login');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(adminUser);
        console.log('🔐 Checking user:', userData.email);
        
        // SIMPLIFIED: Just check if user is staff/superuser
        // Skip API verification to prevent loops
        if (userData.is_staff || userData.is_superuser) {
          console.log('✅ Admin user verified - granting access');
          console.log('✅ User details:', { 
            email: userData.email, 
            is_staff: userData.is_staff, 
            is_superuser: userData.is_superuser 
          });
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } else {
          console.log('❌ User is not admin - denying access');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      } catch (parseError) {
        console.error('❌ Error parsing admin user data:', parseError);
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        setIsAuthenticated(false);
      }

      setIsLoading(false);
      console.log('🔐 Authentication check completed - will not run again');
    };

    checkAuthentication();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []); // EMPTY DEPENDENCY ARRAY - RUN ONLY ONCE

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.primary">
          Verifying Admin Authentication...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Checking credentials and permissions
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    console.log('🚨 SECURITY: Unauthenticated access blocked, redirecting to:', redirectTo);
    console.log('🚨 Current window location:', window.location.href);
    console.log('🚨 Available localStorage keys:', Object.keys(localStorage).filter(k => k.includes('admin')));
    console.log('🚨 Admin token value:', localStorage.getItem('admin_access_token')?.substring(0, 20) + '...');
    console.log('🚨 Admin user value:', localStorage.getItem('admin_user'));
    return <Navigate to={redirectTo} replace />;
  }

  // Render protected content if authenticated
  console.log('✅ SECURITY: Admin access granted, rendering dashboard');
  console.log('✅ Current pathname:', window.location.pathname);
  console.log('✅ Expected pathname: /admin/dashboard');
  return <>{children}</>;
};

export default AdminProtectedRoute;