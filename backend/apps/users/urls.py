"""
URL configuration for the users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserProfileViewSet, VerificationRequestViewSet
)
from .admin_views import (
    AdminUserViewSet, VerificationRequestViewSet as AdminVerificationRequestViewSet
)
from .emergency_admin import emergency_admin_fix

app_name = 'users'

router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')
router.register(r'profiles', UserProfileViewSet, basename='profiles')
router.register(r'verification-requests', VerificationRequestViewSet, basename='verification-requests')

# Admin endpoints
admin_router = DefaultRouter()
admin_router.register(r'verification-requests', AdminVerificationRequestViewSet, basename='admin-verification-requests')
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
    # Emergency admin fix endpoint
    path('emergency/grant-admin/', emergency_admin_fix, name='emergency-admin-fix'),
]