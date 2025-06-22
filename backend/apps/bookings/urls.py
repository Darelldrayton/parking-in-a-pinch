from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, BookingReviewViewSet
from .admin_views import booking_search_view, quick_booking_lookup, redirect_to_booking_detail, admin_booking_search_api

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'reviews', BookingReviewViewSet, basename='booking-review')

urlpatterns = [
    path('', include(router.urls)),
    # Admin views
    path('admin/search/', booking_search_view, name='booking_search'),
    path('admin/quick-lookup/', quick_booking_lookup, name='quick_booking_lookup'),
    path('admin/redirect/<str:booking_id>/', redirect_to_booking_detail, name='redirect_to_booking_detail'),
    # API endpoint for React admin dashboard
    path('admin/search-api/', admin_booking_search_api, name='admin_booking_search_api'),
]