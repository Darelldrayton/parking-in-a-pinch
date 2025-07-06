"""
URLs for parking listings.
"""
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import ParkingListingViewSet, ListingImageViewSet, MyListingsView
from .admin_views import AdminListingViewSet

app_name = 'listings'

@csrf_exempt
def admin_listings_stats(request):
    """Listings stats endpoint that frontend expects"""
    try:
        from .models import ParkingListing
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        one_week_ago = now - timedelta(days=7)
        
        stats = {
            'total_listings': ParkingListing.objects.count(),
            'pending_listings': ParkingListing.objects.filter(approval_status=ParkingListing.ApprovalStatus.PENDING).count(),
            'approved_listings': ParkingListing.objects.filter(approval_status=ParkingListing.ApprovalStatus.APPROVED).count(),
            'rejected_listings': ParkingListing.objects.filter(approval_status=ParkingListing.ApprovalStatus.REJECTED).count(),
            'recent_listings': ParkingListing.objects.filter(created_at__gte=one_week_ago).count(),
            'active_listings': ParkingListing.objects.filter(is_active=True).count(),
        }
        
        return JsonResponse(stats)
        
    except Exception as e:
        return JsonResponse({'error': f'Listings stats error: {str(e)}'}, status=500)

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'', AdminListingViewSet, basename='admin-listings')

# Manual URL patterns for the viewset to avoid API root conflicts
urlpatterns = [
    # Stats endpoint that frontend expects as fallback
    path('admin/stats/', admin_listings_stats, name='admin-listings-stats'),
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