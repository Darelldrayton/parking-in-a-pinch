"""
URL configuration for Parking in a Pinch project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
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
    # path('api/v1/location/', include('apps.location.urls')),
    # path('api/v1/qr-codes/', include('apps.qr_codes.urls')),
    # path('api/v1/analytics/', include('apps.analytics.urls')),
    
    # Admin booking search
    path('admin/bookings/', include('apps.bookings.urls')),
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