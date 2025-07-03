"""
URL patterns for disputes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create separate routers for regular and admin viewsets
user_router = DefaultRouter()
user_router.register(r'', views.DisputeViewSet, basename='dispute')

admin_router = DefaultRouter()
admin_router.register(r'', views.AdminDisputeViewSet, basename='admin-dispute')

urlpatterns = [
    path('admin/', include(admin_router.urls)),
    path('', include(user_router.urls)),
]