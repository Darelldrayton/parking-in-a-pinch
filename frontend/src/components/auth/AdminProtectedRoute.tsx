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
    // CRITICAL FIX: Only check authentication once with empty dependency array
    const checkAuthentication = async () => {
      console.log('🔐 AdminProtectedRoute: Checking authentication (ONE TIME ONLY)...');
      console.log('🔐 Current path:', window.location.pathname);
      console.log('🔐 Timestamp:', new Date().toISOString());
      console.log('🔐 RedirectTo prop:', redirectTo);
      
      // Check if user just logged in - give them time to set up (but only once)
      const justLoggedIn = sessionStorage.getItem('just_logged_in');
      if (justLoggedIn) {
        console.log('⏳ User just logged in - waiting for tokens to settle...');
        // Clear the flag immediately to prevent infinite loop
        sessionStorage.removeItem('just_logged_in');
        // Give a small delay for tokens to be copied
        setTimeout(() => {
          checkAuthentication();
        }, 1000);
        return;
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
        
        // For owner account, bypass additional checks
        if (userData.email === 'darelldrayton93@gmail.com') {
          console.log('✅ Owner account verified - granting access');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // For other users, verify token with backend (simplified)
        try {
          const response = await fetch('/api/v1/auth/verify/', {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            console.log('✅ Token verified with backend - granting access');
            setIsAuthenticated(true);
          } else {
            console.log('❌ Token verification failed:', response.status);
            // Clear invalid tokens
            localStorage.removeItem('admin_access_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_user');
            setIsAuthenticated(false);
          }
        } catch (verifyError) {
          console.warn('⚠️ Token verification failed, checking staff/superuser status:', verifyError);
          // If verification endpoint doesn't exist, still allow access for staff/superuser
          if (userData.is_staff || userData.is_superuser) {
            console.log('✅ Staff/superuser access granted');
            setIsAuthenticated(true);
          } else {
            console.log('❌ Non-staff user denied access');
            setIsAuthenticated(false);
          }
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
    return <Navigate to={redirectTo} replace />;
  }

  // Render protected content if authenticated
  console.log('✅ SECURITY: Admin access granted, rendering dashboard');
  console.log('✅ Current pathname:', window.location.pathname);
  console.log('✅ Expected pathname: /admin/dashboard');
  return <>{children}</>;
};

export default AdminProtectedRoute;