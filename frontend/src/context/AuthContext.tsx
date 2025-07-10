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
    const initializeAuth = async () => {
      const storedToken = authService.getAccessToken()
      const storedUser = authService.getStoredUser()
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(storedUser)
        
        // Verify token is still valid by fetching current user
        try {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          localStorage.setItem('user', JSON.stringify(currentUser))
        } catch (error) {
          // Token is invalid, clear storage
          await logout()
        }
      }
      setIsLoading(false)
    }
    
    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('AuthContext: Starting login for:', email)
      const response = await authService.login({ email, password })
      console.log('AuthContext: Login response:', response)
      
      setUser(response.user)
      setToken(response.access || response.tokens?.access || '')
      
      console.log('Welcome back!')
    } catch (error: any) {
      console.error('AuthContext: Login error:', error)
      console.error('AuthContext: Error response:', error.response)
      const message = error.response?.data?.detail || 
                     error.response?.data?.non_field_errors?.[0] ||
                     'Login failed. Please check your credentials.'
      console.error('AuthContext: Error message:', message)
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
        username: data.email.split('@')[0], // Generate username from email
        password: data.password,
        password2: data.password2 || data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        user_type: data.user_type
      }
      
      console.log('AuthContext: Starting signup with:', signupData)
      const response = await authService.signup(signupData)
      console.log('AuthContext: Signup response:', response)
      
      setUser(response.user)
      setToken(response.access || response.tokens?.access || '')
      
      console.log('Account created successfully!')
    } catch (error: any) {
      console.error('AuthContext: Signup error:', error)
      console.error('AuthContext: Signup error response:', error.response)
      
      // Extract error message from various possible formats
      let message = 'Signup failed. Please try again.'
      
      if (error.response?.data) {
        const data = error.response.data
        console.log('AuthContext: Error data:', data)
        
        // Check for various error formats
        if (data.error) {
          // Handle nested error object
          if (typeof data.error === 'object') {
            const errorKeys = Object.keys(data.error)
            if (errorKeys.length > 0) {
              const firstError = data.error[errorKeys[0]]
              message = Array.isArray(firstError) ? firstError[0] : firstError
            }
          } else {
            message = data.error
          }
        } else if (data.detail) {
          message = data.detail
        } else if (data.email?.[0]) {
          message = data.email[0]
        } else if (data.password?.[0]) {
          message = data.password[0]
        } else if (data.username?.[0]) {
          message = data.username[0]
        } else if (data.non_field_errors?.[0]) {
          message = data.non_field_errors[0]
        }
      }
      
      console.error('AuthContext: Final error message:', message)
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
      console.log('Logged out successfully')
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData)
      console.log('🔍 AuthContext updateUser - before setUser:', JSON.stringify(user, null, 2))
      console.log('🔍 AuthContext updateUser - setting new user:', JSON.stringify(updatedUser, null, 2))
      setUser(updatedUser)
      console.log('Profile updated successfully!')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update profile'
      throw new Error(message)
    }
  }

  const setUserState = (newUser: User) => {
    console.log('🔍 AuthContext setUserState - updating user:', JSON.stringify(newUser, null, 2))
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    updateUser,
    setUserState,
    isLoading,
    isAuthenticated: !!token && !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}