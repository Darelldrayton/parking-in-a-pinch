import axios, { type AxiosResponse, type AxiosError } from 'axios'
import toast from 'react-hot-toast'

// AGGRESSIVE API FIX - FORCE DIGITALOCEAN URL v6.0 + TOKEN AUTH FIX
// console.log('🚀 API Configuration Loading - FORCE DigitalOcean v6.0 + Token Auth Fix')

// API Configuration - Use Vercel proxy (backend is HTTP, proxy handles HTTPS)
const API_BASE_URL = '/api/v1'

// REMOVED: Hardcoded production token - let users authenticate properly


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
    const isAuthEndpoint = config.url?.includes('/auth/') && (
                          config.url?.includes('/login') || 
                          config.url?.includes('/register') ||
                          config.url?.includes('/signup') ||
                          config.url?.includes('auth-token'))
    
    if (isAuthEndpoint) {
      return config
    }
    
    const isAdminRequest = config.url?.includes('/admin/')
    let token = null
    
    if (isAdminRequest) {
      token = localStorage.getItem('admin_access_token') || localStorage.getItem('token')
    } else {
      token = localStorage.getItem('token') || localStorage.getItem('access_token')
    }
    
    if (token) {
      config.headers.Authorization = `Token ${token}`
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
    refreshAttempts = 0
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const currentPath = window.location.pathname
      if (currentPath === '/admin/login' || currentPath === '/login') {
        return Promise.reject(error)
      }
      
      const isAdminApiRequest = originalRequest.url?.includes('/admin/')
      
      if (isAdminApiRequest) {
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
        return Promise.reject(error)
      }
      
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        refreshAttempts = 0
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
      
      refreshAttempts++
      
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('access_token', access)
          localStorage.setItem('token', access)
          
          originalRequest.headers.Authorization = `Token ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    if (error.response?.status && error.response.status >= 400 && error.response?.status !== 401) {
      const errorData = error.response?.data as any
      const message = errorData?.detail || errorData?.message || 'An error occurred'
      toast.error(message)
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
