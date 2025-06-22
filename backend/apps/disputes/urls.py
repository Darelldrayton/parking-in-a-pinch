"""
URL patterns for disputes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.DisputeViewSet, basename='dispute')
router.register(r'admin', views.AdminDisputeViewSet, basename='admin-dispute')

urlpatterns = [
    path('', include(router.urls)),
]