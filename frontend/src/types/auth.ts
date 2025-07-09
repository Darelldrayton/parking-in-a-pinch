// Authentication related types

export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupForm {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  user_type: 'renter' | 'host' | 'both';
  phone_number?: string;
  agree_to_terms: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'renter' | 'host' | 'both';
  is_verified: boolean;
  is_email_verified: boolean;
  phone_number?: string;
  profile_picture?: string;
  profile_picture_url?: string;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginForm) => Promise<void>;
  signup: (data: SignupForm) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface PasswordChangeForm {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export interface PasswordResetForm {
  email: string;
}

export interface PasswordResetConfirmForm {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}