import api from './api'

export interface UserProfile {
  primary_vehicle_make?: string
  primary_vehicle_model?: string
  primary_vehicle_year?: number
  primary_vehicle_color?: string
  primary_vehicle_license_plate?: string
  primary_vehicle_state?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  auto_approve_bookings?: boolean
  email_notifications?: boolean
  sms_notifications?: boolean
  push_notifications?: boolean
  show_phone_to_guests?: boolean
  show_last_name?: boolean
  marketing_emails?: boolean
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  username: string
  user_type: 'seeker' | 'host' | 'both'
  is_verified: boolean
  is_email_verified: boolean
  phone_number?: string
  profile_picture?: string
  profile_picture_url?: string
  profile_image?: string
  bio?: string
  created_at?: string
  updated_at?: string
  profile?: UserProfile
  subscribe_to_newsletter?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  username: string
  password: string
  password2: string
  first_name: string
  last_name: string
  user_type: 'seeker' | 'host' | 'both'
  phone_number?: string
  subscribe_to_newsletter?: boolean
}

export interface AuthResponse {
  access?: string
  refresh: string
  user: User
  tokens?: {
    access: string
    refresh: string
  }
}

export interface TokenRefreshResponse {
  access: string
  refresh?: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // console.log('AuthService: Attempting login with:', credentials)
    const response = await api.post('/auth/login/', credentials)
    // console.log('AuthService: Login response status:', response.status)
    // console.log('AuthService: Login response data:', response.data)
    const data = response.data
    
    // Store tokens and user data
    this.storeAuthData(data)
    // console.log('AuthService: Auth data stored')
    
    return data
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    // console.log('AuthService: Attempting signup with:', data)
    const response = await api.post('/auth/register/', data)
    // console.log('AuthService: Signup response status:', response.status)
    // console.log('AuthService: Signup response data:', response.data)
    
    const rawData = response.data
    
    // Transform response to match expected format
    const authData: AuthResponse = {
      access: rawData.tokens?.access || rawData.access,
      refresh: rawData.tokens?.refresh || rawData.refresh,
      user: rawData.user || rawData,
      tokens: rawData.tokens
    }
    
    // console.log('AuthService: Transformed auth data:', authData)
    
    // Store tokens and user data
    this.storeAuthData(authData)
    // console.log('AuthService: Signup auth data stored')
    
    return authData
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuthData()
    }
  }

  async refreshToken(refresh: string): Promise<TokenRefreshResponse> {
    const response = await api.post('/auth/token/refresh/', { refresh })
    const data = response.data
    
    // Update stored access token
    localStorage.setItem('access_token', data.access)
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh)
    }
    
    return data
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me/')
    // console.log('🔍 getCurrentUser API response:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    // Filter out profile_picture if it's empty or invalid, and flatten profile data
    const { profile_picture, profile, ...userData } = data
    
    // Only include profile_picture if it's a valid file
    const updateData: any = { ...userData }
    if (profile_picture && profile_picture instanceof File) {
      updateData.profile_picture = profile_picture
    }
    
    // Flatten profile data into the main update data
    if (profile && Object.keys(profile).length > 0) {
      // Add profile fields directly to the update data
      Object.keys(profile).forEach(key => {
        updateData[key] = profile[key]
      })
    }
    
    try {
      // Update user data (including flattened profile data)
      const userResponse = await api.patch('/users/me/', updateData)
      let updatedUser = userResponse.data
      
      // Get updated user data with profile to ensure we have the latest data
      const refreshedUserResponse = await api.get('/users/me/')
      updatedUser = refreshedUserResponse.data
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      return updatedUser
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  async uploadProfilePhoto(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('profile_picture', file)
    
    try {
      const response = await api.post('/users/upload_profile_photo/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // console.log('🔍 Upload response:', JSON.stringify(response.data, null, 2))
      
      // Get updated user data
      const updatedUser = await this.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // console.log('🔍 Updated user after photo upload:', JSON.stringify(updatedUser, null, 2))
      
      return updatedUser
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      throw error
    }
  }

  async deleteProfilePhoto(): Promise<User> {
    try {
      await api.delete('/users/delete_profile_photo/')
      
      // Get updated user data
      const updatedUser = await this.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      return updatedUser
    } catch (error) {
      console.error('Error deleting profile photo:', error)
      throw error
    }
  }

  async changePassword(data: {
    old_password: string
    new_password: string
    new_password2: string
  }): Promise<void> {
    await api.patch('/auth/password/change/', data)
  }

  async resetPassword(email: string): Promise<void> {
    // console.log('AuthService: Attempting password reset for:', email)
    try {
      const response = await api.post('/auth/password/reset/', { email })
      // console.log('AuthService: Password reset response:', response.data)
      return response.data
    } catch (error) {
      console.error('AuthService: Password reset error:', error)
      throw error
    }
  }

  async confirmResetPassword(data: {
    uid: string
    token: string
    new_password: string
    new_password2: string
  }): Promise<void> {
    await api.post('/auth/password/reset/confirm/', data)
  }

  async resendVerificationEmail(): Promise<void> {
    await api.post('/auth/email/resend/')
  }

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/email/verify/', { token })
  }

  async deleteAccount(data: {
    password: string
    confirmation: string
  }): Promise<void> {
    await api.post('/auth/account/delete/', data)
    // Clear stored auth data after successful deletion
    this.clearAuthData()
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  private storeAuthData(data: AuthResponse): void {
    // Handle both response formats (direct tokens or nested tokens object)
    const accessToken = data.access || data.tokens?.access
    const refreshToken = data.refresh || data.tokens?.refresh

    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
  }

  clearAuthData(): void {
    // Clear authentication tokens (both JWT and DRF formats)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('token') // CRITICAL: Clear DRF token that causes user data leakage
    
    // SECURITY FIX: Clear all user-specific cached data to prevent data leakage
    const userDataKeys = [
      'user_preferences',
      'draft_listings', 
      'booking_drafts',
      'listings_cache',
      'bookings_cache',
      'user_profile_cache',
      'search_cache',
      'messages_cache',
      'parking_performance_metrics',
      'cachedUnreadCount',
      'parking_app_backup', // Clear all backups containing user data
      'user_search_history',
      'user_favorites',
      'user_settings'
    ]
    
    userDataKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clear any cache keys that might contain user data (but not admin data)
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('admin_') && (key.includes('cache') || key.includes('draft') || key.includes('user_'))) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('🔐 All user data cleared from localStorage for security')
  }

  // SECURITY FIX: Dedicated admin logout function
  clearAdminAuthData(): void {
    // Clear admin authentication tokens
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    
    // Clear admin-specific cached data to prevent data leakage between admin users
    const adminDataKeys = [
      'admin_preferences',
      'admin_cache',
      'admin_debug_logs',
      'admin_login_debug_logs',
      'admin_error_logs',
      'admin_dashboard_cache',
      'admin_user_cache',
      'admin_booking_cache',
      'admin_listing_cache',
      'admin_settings',
      'admin_backup',
      'admin_session_data'
    ]
    
    adminDataKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clear any admin-specific cache keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('admin_') && (key.includes('cache') || key.includes('debug') || key.includes('log'))) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear session storage admin data
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('admin_')) {
        sessionStorage.removeItem(key)
      }
    })
    
    console.log('🔐 All admin data cleared from localStorage for security')
  }
}

export default new AuthService()