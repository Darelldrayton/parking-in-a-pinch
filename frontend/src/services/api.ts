import axios, { type AxiosResponse, type AxiosError } from 'axios'
import toast from 'react-hot-toast'

// AGGRESSIVE API FIX - FORCE DIGITALOCEAN URL v6.0 + TOKEN AUTH FIX
console.log('🚀 API Configuration Loading - FORCE DigitalOcean v6.0 + Token Auth Fix')

// USE VERCEL PROXY TO BYPASS HTTPS/HTTP MIXED CONTENT
const API_BASE_URL = '/api/v1'

// REMOVED: Hardcoded production token - let users authenticate properly

console.log('💥 FORCED API BASE URL:', API_BASE_URL)
console.log('🔑 FORCED DRF Token Auth (Backend requires Token format, not Bearer)')
console.log('🎯 This should fix login + messaging on parkinginapinch.com')

// Track refresh attempts to prevent infinite loops
let refreshAttempts = 0
const MAX_REFRESH_ATTEMPTS = 1

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    console.log('API Base URL:', API_BASE_URL)
    console.log('Full URL:', `${API_BASE_URL}${config.url}`)
    
    // Determine if this is an admin request
    const isAdminRequest = config.url?.includes('/admin/') || 
                          config.url?.includes('/users/admin/') ||
                          config.url?.includes('/payments/admin/') ||
                          config.url?.includes('/listings/admin/') ||
                          config.url?.includes('/disputes/admin/')
    
    let token = null
    
    if (isAdminRequest) {
      // For admin requests, prefer admin token
      token = localStorage.getItem('admin_access_token')
      if (token) {
        console.log('✅ Using admin Token authentication:', token.substring(0, 8) + '...')
      } else {
        console.log('⚠️ No admin token found for admin request - trying regular token')
        token = localStorage.getItem('token') || localStorage.getItem('access_token')
      }
    } else {
      // For regular requests, use regular token
      token = localStorage.getItem('token') || localStorage.getItem('access_token')
    }
    
    if (token) {
      config.headers.Authorization = `Token ${token}`
      console.log('✅ Using Token authentication format (v6.0):', token.substring(0, 8) + '...')
    } else {
      console.log('⚠️ No authentication token found - request will be anonymous')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.data)
    // Reset refresh attempts on successful response
    refreshAttempts = 0
    return response
  },
  async (error: AxiosError) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Check if we're already on login pages to prevent redirect loops
      const currentPath = window.location.pathname
      if (currentPath === '/admin/login' || currentPath === '/login') {
        return Promise.reject(error)
      }
      
      // CRITICAL FIX: Disable JWT refresh for admin routes to prevent infinite loops
      // BUT allow login requests to proceed
      if (currentPath.includes('/admin') && !originalRequest.url?.includes('/login')) {
        console.warn('🔒 Admin route detected - clearing tokens and redirecting to login')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
        return Promise.reject(error)
      }
      
      // Check refresh attempt limit to prevent infinite loops
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.warn('🔒 Max refresh attempts reached - clearing tokens and redirecting')
        refreshAttempts = 0
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      
      refreshAttempts++
      
      // On mobile, prevent aggressive redirects that cause logout during navigation
      // BUT allow login requests to proceed
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (isMobile && currentPath.includes('/admin') && !originalRequest.url?.includes('/login')) {
        console.warn('🔒 Mobile admin page - skipping aggressive token refresh to prevent logout')
        return Promise.reject(error)
      }
      
      // Determine if this was an admin request
      const isAdminRequest = originalRequest.url?.includes('/admin/') || 
                            originalRequest.url?.includes('/users/admin/') ||
                            originalRequest.url?.includes('/payments/admin/') ||
                            originalRequest.url?.includes('/listings/admin/') ||
                            originalRequest.url?.includes('/disputes/admin/')
      
      if (isAdminRequest) {
        // Handle admin token refresh
        const adminRefreshToken = localStorage.getItem('admin_refresh_token')
        if (adminRefreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/admin/token/refresh/`, {
              refresh: adminRefreshToken
            })
            
            const { access } = response.data
            localStorage.setItem('admin_access_token', access)
            
            // Retry original request with new admin token
            originalRequest.headers.Authorization = `Token ${access}`
            return api(originalRequest)
          } catch (refreshError) {
            console.error('Admin token refresh failed:', refreshError)
            // Admin refresh failed, redirect to admin login
            console.warn('Admin token refresh failed, clearing session')
            
            // Add delay before redirect to prevent race conditions on mobile
            setTimeout(() => {
              localStorage.removeItem('admin_access_token')
              localStorage.removeItem('admin_refresh_token')
              localStorage.removeItem('admin_user')
              
              // Only redirect if not already redirecting
              if (!sessionStorage.getItem('admin_redirecting')) {
                sessionStorage.setItem('admin_redirecting', 'true')
                window.location.href = '/admin/login'
              }
            }, 100)
            
            return Promise.reject(refreshError)
          }
        } else {
          // No admin refresh token, redirect to admin login
          console.warn('No admin refresh token available')
          
          // Add delay before redirect to prevent race conditions on mobile
          setTimeout(() => {
            localStorage.removeItem('admin_access_token')
            localStorage.removeItem('admin_refresh_token')
            localStorage.removeItem('admin_user')
            
            // Only redirect if not already redirecting
            if (!sessionStorage.getItem('admin_redirecting')) {
              sessionStorage.setItem('admin_redirecting', 'true')
              window.location.href = '/admin/login'
            }
          }, 100)
          
          return Promise.reject(error)
        }
      } else {
        // Handle regular user token refresh
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken
            })
            
            const { access } = response.data
            localStorage.setItem('access_token', access)
            
            // Retry original request with new token - USE TOKEN FORMAT NOT BEARER
            originalRequest.headers.Authorization = `Token ${access}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }

    // Handle other errors
    if (error.response?.status && error.response.status >= 400) {
      const errorData = error.response?.data as any
      const message = errorData?.detail || 
                     errorData?.message || 
                     'An error occurred'
      
      if (error.response?.status !== 401) {
        toast.error(message)
      }
    }

    return Promise.reject(error)
  }
)

// Utility functions for admin token management
export const adminTokenUtils = {
  /**
   * Check if admin tokens are valid and not expired
   */
  validateAdminTokens(): boolean {
    const token = localStorage.getItem('admin_access_token')
    const refreshToken = localStorage.getItem('admin_refresh_token')
    const user = localStorage.getItem('admin_user')
    
    if (!token || !refreshToken || !user) {
      console.warn('Missing admin credentials')
      return false
    }
    
    try {
      // Basic token format validation
      if (token.split('.').length !== 3) {
        console.warn('Invalid admin token format')
        return false
      }
      
      // Try to decode the token payload (basic validation)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < now) {
        console.warn('Admin token expired')
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error validating admin token:', error)
      return false
    }
  },

  /**
   * Clear all admin tokens and redirect to login
   */
  clearAdminSession(): void {
    console.log('Clearing admin session')
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
  },

  /**
   * Get admin user info from localStorage
   */
  getAdminUser(): any | null {
    try {
      const userStr = localStorage.getItem('admin_user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing admin user:', error)
      return null
    }
  },

  /**
   * Check if current user has admin privileges
   */
  hasAdminPrivileges(): boolean {
    const user = this.getAdminUser()
    if (!user) return false
    
    // Owner account bypass
    if (user.email === 'darelldrayton93@gmail.com') {
      return true
    }
    
    return user.is_staff || user.is_superuser
  }
}

export default api
