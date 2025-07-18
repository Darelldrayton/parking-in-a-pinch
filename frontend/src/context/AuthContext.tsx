import React, { createContext, useContext, useState, useEffect } from 'react'
import authService, { type User } from '../services/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  setUserState: (user: User) => void
  isLoading: boolean
  isAuthenticated: boolean
}

interface SignupData {
  email: string
  password: string
  password2?: string
  first_name: string
  last_name: string
  user_type: 'seeker' | 'host' | 'both'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip auth initialization on admin pages
    const isAdminPage = window.location.pathname.includes('/admin');
    if (isAdminPage) {
      console.log('🔒 AuthContext: Skipping initialization on admin page');
      setIsLoading(false);
      return;
    }
    
    // Clear any stale data on first load
    const storedToken = authService.getAccessToken()
    const storedUser = authService.getStoredUser()
    
    // Only trust both token and user if both exist
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(storedUser)
    } else {
      // Clear any partial/stale data
      authService.clearAuthData()
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authService.login({ email, password })
      setUser(response.user)
      const token = response.token || response.access || response.tokens?.access || ''
      setToken(token)
    } catch (error: any) {
      const message = error.response?.data?.detail || 
                     error.response?.data?.non_field_errors?.[0] ||
                     'Login failed. Please check your credentials.'
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (data: SignupData) => {
    setIsLoading(true)
    try {
      const signupData = {
        email: data.email,
        username: data.email.split('@')[0],
        password: data.password,
        password2: data.password2 || data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        user_type: data.user_type
      }
      
      const response = await authService.signup(signupData)
      setUser(response.user)
      const token = response.token || response.access || response.tokens?.access || ''
      setToken(token)
    } catch (error: any) {
      const message = error.response?.data?.detail || 
                     error.response?.data?.email?.[0] ||
                     error.response?.data?.password?.[0] ||
                     'Signup failed. Please try again.'
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      window.location.href = '/login'
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData)
      setUser(updatedUser)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update profile'
      throw new Error(message)
    }
  }

  const setUserState = (newUser: User) => {
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const isAuthenticated = !!token && !!user
  
  const value = {
    user,
    token,
    login,
    signup,
    logout,
    updateUser,
    setUserState,
    isLoading,
    isAuthenticated
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}