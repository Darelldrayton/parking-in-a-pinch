"""
URL configuration for Parking in a Pinch project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Global dashboard test endpoint - bypasses all DRF middleware
@csrf_exempt
def dashboard_data_test(request):
    """Test dashboard data at root level - bypasses DRF completely"""
    try:
        from django.contrib.auth import get_user_model
        from django.utils import timezone
        from datetime import timedelta
        
        User = get_user_model()
        now = timezone.now()
        one_week_ago = now - timedelta(days=7)
        
        # Get user stats
        total_users = User.objects.count()
        recent_users = User.objects.filter(created_at__gte=one_week_ago).count()
        
        # Try bookings
        try:
            from apps.bookings.models import Booking
            total_bookings = Booking.objects.count()
        except Exception as e:
            total_bookings = f"Booking error: {str(e)}"
        
        # Try listings
        try:
            from apps.listings.models import ParkingListing
            total_listings = ParkingListing.objects.count()
        except Exception as e:
            total_listings = f"Listing error: {str(e)}"
            
        # Try disputes
        try:
            from apps.disputes.models import Dispute
            total_disputes = Dispute.objects.count()
        except Exception as e:
            total_disputes = f"Dispute error: {str(e)}"
        
        result = {
            'message': 'ROOT LEVEL TEST - BYPASSES ALL MIDDLEWARE',
            'total_users': total_users,
            'recent_users': recent_users,
            'total_bookings': total_bookings,
            'total_listings': total_listings,
            'total_disputes': total_disputes,
            'timestamp': now.isoformat(),
        }
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({'error': f'Root test error: {str(e)}'}, status=500)

urlpatterns = [
    # Dashboard data test endpoint - bypasses DRF middleware
    path('api/test-data/', dashboard_data_test, name='dashboard-data-test'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Authentication
    path('api/v1/auth/', include('apps.authentication.urls')),
    
    # API endpoints
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/listings/', include('apps.listings.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/reviews/', include('apps.reviews.urls')),
    path('api/v1/messages/', include('apps.messaging.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/disputes/', include('apps.disputes.urls')),
    path('api/v1/careers/', include('apps.careers.urls')),
    # path('api/v1/location/', include('apps.location.urls')),
    # path('api/v1/qr-codes/', include('apps.qr_codes.urls')),
    # path('api/v1/analytics/', include('apps.analytics.urls')),
    
    # Admin dashboard endpoints
    path('api/v1/admin/', include('apps.admin_dashboard.urls')),
    
    # Direct test endpoint for admin dashboard
    path('api/v1/test-admin-stats/', dashboard_data_test, name='test-admin-stats'),
    
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Debug toolbar in development
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass