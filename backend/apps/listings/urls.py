"""
URLs for parking listings.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import ParkingListingViewSet, ListingImageViewSet, MyListingsView
from .admin_views import AdminListingViewSet

app_name = 'listings'

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'', AdminListingViewSet, basename='admin-listings')

# Manual URL patterns for the viewset to avoid API root conflicts
urlpatterns = [
    # Admin endpoints
    path('admin/', include(admin_router.urls)),
    
    # My listings endpoint
    path('my-listings/', MyListingsView.as_view(), name='my-listings'),
    
    # Main listings endpoints
    path('', ParkingListingViewSet.as_view({'get': 'list', 'post': 'create'}), name='listings-list'),
    
    # Custom actions - these MUST come before the detail view to avoid conflicts
    path('<int:pk>/toggle_status/', ParkingListingViewSet.as_view({'post': 'toggle_status'}), name='listings-toggle-status'),
    path('<int:pk>/availability/', ParkingListingViewSet.as_view({'get': 'availability'}), name='listings-availability'),
    path('nearby/', ParkingListingViewSet.as_view({'get': 'nearby'}), name='listings-nearby'),
    
    # Detail endpoint MUST come last since it will match <int:pk>/
    path('<int:pk>/', ParkingListingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='listings-detail'),
    
    # Images
    path('<int:listing_pk>/images/', ListingImageViewSet.as_view({'get': 'list', 'post': 'create'}), name='listing-images-list'),
    path('<int:listing_pk>/images/<int:pk>/', ListingImageViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='listing-images-detail'),
]