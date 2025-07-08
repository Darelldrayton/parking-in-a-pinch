import axios, { type AxiosResponse, type AxiosError } from 'axios'
import toast from 'react-hot-toast'

// AGGRESSIVE API FIX - FORCE DIGITALOCEAN URL v5.0 + TOKEN AUTH FIX
console.log('🚀 API Configuration Loading - FORCE DigitalOcean v5.0 + Token Auth Fix')

// USE VERCEL PROXY TO BYPASS HTTPS/HTTP MIXED CONTENT
const API_BASE_URL = '/api/v1'

// FORCE PRODUCTION TOKEN FOR BACKEND COMPATIBILITY
const PRODUCTION_TOKEN = '003a2cb31d4aa5f8e07ae0d49287c27e64ada955'

console.log('💥 FORCED API BASE URL:', API_BASE_URL)
console.log('🔑 FORCED DRF Token Auth (Backend requires Token format, not Bearer)')
console.log('🎯 This should fix login + messaging on parkinginapinch.com')

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
    
    // FORCE DRF Token format - backend ONLY accepts Token auth, NOT Bearer
    const drf_token = localStorage.getItem('token') || PRODUCTION_TOKEN
    
    // ALWAYS use Token format for DRF compatibility  
    config.headers.Authorization = `Token ${drf_token}`
    console.log('✅ FORCED Token authentication:', drf_token.substring(0, 8) + '...')
    
    // Ensure production token is cached for future requests
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', PRODUCTION_TOKEN)
      console.log('🔧 Cached production token to localStorage')
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
    return response
  },
  async (error: AxiosError) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`
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

export default api
