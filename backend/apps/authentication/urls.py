"""
URL configuration for authentication app.
"""
from django.urls import path
from . import views
from .enhanced_auth import enhanced_token_refresh, auto_login_refresh

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Password management
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Email verification
    path('email/verify/', views.verify_email, name='verify_email'),
    path('email/resend/', views.resend_verification_email, name='resend_verification'),
    
    # Account deletion
    path('account/delete/', views.DeleteAccountView.as_view(), name='delete_account'),
    
    # Enhanced authentication endpoints
    path('token/refresh/enhanced/', enhanced_token_refresh, name='enhanced_token_refresh'),
    path('auto-refresh/', auto_login_refresh, name='auto_login_refresh'),
]