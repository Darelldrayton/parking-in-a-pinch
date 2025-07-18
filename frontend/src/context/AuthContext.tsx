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
      console.log('🔄 AuthContext: Starting initialization...')
      const storedToken = authService.getAccessToken()
      const storedUser = authService.getStoredUser()
      
      console.log('🔍 AuthContext: Found credentials:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        tokenPrefix: storedToken ? storedToken.substring(0, 8) + '...' : 'none'
      })
      
      // CRITICAL: Both token AND user must exist for valid auth state
      if (storedToken && storedUser) {
        console.log('🔐 AuthContext: Setting stored credentials in state...')
        setToken(storedToken)
        setUser(storedUser)
        
        // CRITICAL FIX: Skip token verification immediately after login
        // to prevent clearing newly set credentials
        const justLoggedIn = sessionStorage.getItem('just_logged_in')
        if (justLoggedIn) {
          console.log('✅ AuthContext: Skipping verification - user just logged in')
          sessionStorage.removeItem('just_logged_in')
          setIsLoading(false)
          return
        }
        
        // Also skip verification if we're on auth pages
        if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
          console.log('📍 AuthContext: On auth page - skipping verification')
          setIsLoading(false)
          return
        }
        
        // Try to verify token is still valid by fetching current user
        // But don't clear everything on failure - this could be a network issue
        try {
          console.log('🔍 AuthContext: Verifying token with backend...')
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          localStorage.setItem('user', JSON.stringify(currentUser))
          console.log('✅ AuthContext: Token verified successfully')
        } catch (error) {
          console.warn('⚠️ AuthContext: Token verification failed:', error)
          // Only clear if it's specifically a 401 Unauthorized error
          if (error.response?.status === 401) {
            console.log('🚪 AuthContext: 401 error - clearing invalid credentials')
            authService.clearAuthData()
            setToken(null)
            setUser(null)
          } else {
            console.log('📡 AuthContext: Network/server error - keeping stored credentials')
          }
          // For other errors (network, 500, etc.), keep the stored credentials
        }
      } else {
        // Check for orphaned tokens (token without user)
        if (storedToken && !storedUser) {
          console.log('⚠️ AuthContext: Found token without user - clearing orphaned token')
          authService.clearAuthData()
          setToken(null)
          setUser(null)
        } else if (!storedToken && storedUser) {
          console.log('⚠️ AuthContext: Found user without token - clearing orphaned user')
          localStorage.removeItem('user')
          setUser(null)
        } else {
          console.log('🔍 AuthContext: No stored credentials found')
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
      
      // CRITICAL: Clear all existing state ONLY after successful login to prevent user data leakage
      console.log('🔐 AuthContext: Clearing previous user state after successful login')
      
      // Clear all cached data from previous users
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('cache') || key.includes('draft') || key.includes('user_') || key.includes('booking') || key.includes('listing')
      )
      cacheKeys.forEach(key => localStorage.removeItem(key))
      
      // Set new user state
      setUser(response.user)
      // Handle both DRF token format and JWT format
      const token = response.token || response.access || response.tokens?.access || ''
      setToken(token)
      console.log('🔐 AuthContext: Set token type:', response.token ? 'DRF' : 'JWT')
      
      // CRITICAL FIX: Set flag to skip token verification in useEffect
      // This prevents immediate logout after successful login
      sessionStorage.setItem('just_logged_in', 'true')
      console.log('🎯 AuthContext: Set just_logged_in flag to prevent useEffect clearing')
      
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
      
      // Verify the response has what we need
      if (!response.user) {
        throw new Error('Signup response missing user data')
      }
      if (!response.token && !response.access && !response.tokens?.access) {
        throw new Error('Signup response missing token data')
      }
      
      // CRITICAL: Clear all existing state ONLY after successful signup to prevent user data leakage
      console.log('🔐 AuthContext: Clearing previous user state after successful signup')
      
      // Clear all cached data from previous users
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('cache') || key.includes('draft') || key.includes('user_') || key.includes('booking') || key.includes('listing')
      )
      cacheKeys.forEach(key => localStorage.removeItem(key))
      
      // Set new user state
      console.log('🔐 AuthContext: Setting user state:', response.user)
      setUser(response.user)
      
      // Handle both DRF token format and JWT format (same as login)
      const token = response.token || response.access || response.tokens?.access || ''
      console.log('🔐 AuthContext: Setting token:', token ? 'present' : 'missing')
      setToken(token)
      console.log('🔐 AuthContext: Signup set token type:', response.token ? 'DRF' : 'JWT')
      
      // Verify state was set
      console.log('🔍 AuthContext: State after signup:', {
        hasUser: !!response.user,
        hasToken: !!token,
        isAuthenticated: !!response.user && !!token
      })
      
      // CRITICAL FIX: Set flag to skip token verification in useEffect
      // This prevents immediate logout after successful signup
      sessionStorage.setItem('just_logged_in', 'true')
      console.log('🎯 AuthContext: Set just_logged_in flag to prevent useEffect clearing')
      
      // Force verify that data was stored correctly
      setTimeout(() => {
        const storedUser = authService.getStoredUser()
        const storedToken = authService.getAccessToken()
        console.log('🔍 AuthContext: Verification after signup:', {
          storedUser: !!storedUser,
          storedToken: !!storedToken,
          userEmail: storedUser?.email,
          tokenPrefix: storedToken?.substring(0, 8) + '...'
        })
      }, 50)
      
      // Clear the flag after a delay
      setTimeout(() => {
        console.log('🧹 Clearing just_logged_in flag after signup')
        sessionStorage.removeItem('just_logged_in')
      }, 5000)
      
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
      // CRITICAL: Hard reset all state to prevent data leakage
      console.log('🔐 AuthContext: Hard resetting all state on logout')
      setUser(null)
      setToken(null)
      setIsLoading(false)
      
      // Force a complete page reload to clear any cached state
      console.log('🔄 AuthContext: Forcing page reload to clear cached state')
      // Add hash to force token clearing on login page
      window.location.href = '/login#force-clear'
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