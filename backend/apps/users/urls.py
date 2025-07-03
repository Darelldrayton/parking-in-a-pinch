"""
URL configuration for the users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserProfileViewSet, VerificationRequestViewSet
)
from .profile_photo_views import upload_profile_photo, delete_profile_photo
from .admin_views import (
    AdminUserViewSet, VerificationRequestViewSet as AdminVerificationRequestViewSet
)
from .emergency_admin import emergency_admin_fix

app_name = 'users'

# Create separate routers to avoid URL conflicts
user_router = DefaultRouter()
user_router.register(r'', UserViewSet, basename='users')

profile_router = DefaultRouter()
profile_router.register(r'', UserProfileViewSet, basename='profiles')

verification_router = DefaultRouter()
verification_router.register(r'', VerificationRequestViewSet, basename='verification-requests')

# Admin endpoints
admin_router = DefaultRouter()
admin_router.register(r'verification-requests', AdminVerificationRequestViewSet, basename='admin-verification-requests')
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('verification-requests/', include(verification_router.urls)),
    path('profiles/', include(profile_router.urls)),
    path('admin/', include(admin_router.urls)),
    # Emergency admin fix endpoint
    path('emergency/grant-admin/', emergency_admin_fix, name='emergency-admin-fix'),
    path('', include(user_router.urls)),
]