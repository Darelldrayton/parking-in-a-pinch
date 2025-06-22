"""
URL patterns for the reviews app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReviewViewSet, ReviewTemplateViewSet, ReviewImageViewSet, AdminReviewViewSet
)

app_name = 'reviews'

# Create router for ViewSets
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'templates', ReviewTemplateViewSet, basename='review-template')
router.register(r'images', ReviewImageViewSet, basename='review-image')
router.register(r'admin/reviews', AdminReviewViewSet, basename='admin-review')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Additional custom endpoints can be added here if needed
]