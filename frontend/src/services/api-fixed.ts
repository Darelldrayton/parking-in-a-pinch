import axios, { type AxiosResponse, type AxiosError } from 'axios'
import toast from 'react-hot-toast'

// NUCLEAR API FIX v6.0 - NEW FILE TO BYPASS CACHE
console.log('🔥 NUCLEAR API FIX v6.0 - FORCING DIGITALOCEAN CONNECTION')

// ABSOLUTE HARD-CODED URL - DIRECT TO DIGITALOCEAN SERVER
const API_BASE_URL = 'http://165.227.111.160/api/v1'

console.log('💥 NUCLEAR API BASE URL:', API_BASE_URL)
console.log('🎯 This WILL fix login on parkinginapinch.com')

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
    console.log('🔥 NUCLEAR API Request:', config.method?.toUpperCase(), config.url, config.data)
    console.log('🔥 NUCLEAR API Base URL:', API_BASE_URL)
    console.log('🔥 NUCLEAR Full URL:', `${API_BASE_URL}${config.url}`)
    
    // Try multiple token formats for compatibility
    const bearerToken = localStorage.getItem('access_token')
    const drf_token = localStorage.getItem('token')
    
    if (bearerToken) {
      config.headers.Authorization = `Bearer ${bearerToken}`
      console.log('Using Bearer token authentication')
    } else if (drf_token) {
      config.headers.Authorization = `Token ${drf_token}`
      console.log('Using Token authentication')
    } else {
      console.log('No authentication token found')
    }
    
    return config
  },
  (error) => {
    console.error('API request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.data)
    return response
  },
  (error: AxiosError) => {
    console.log('API Error:', error.response?.status)
    
    // Log full error details for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      })
    } else if (error.request) {
      console.error('API Error Request:', error.request)
    } else {
      console.error('API Error Message:', error.message)
    }
    
    // Handle specific errors
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login')
      // Clear tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token')
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      console.log('Forbidden - access denied')
      toast.error('Access denied. Please check your permissions.')
    } else if (error.response?.status === 500) {
      console.log('Server error')
      toast.error('Server error. Please try again later.')
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.log('Network error - possibly offline')
      toast.error('Network error. Please check your connection.')
    }
    
    return Promise.reject(error)
  }
)

export default api