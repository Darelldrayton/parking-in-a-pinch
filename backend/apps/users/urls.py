"""
URL configuration for the users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileViewSet

app_name = 'users'

router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')
router.register(r'profiles', UserProfileViewSet, basename='profiles')

urlpatterns = [
    path('', include(router.urls)),
]