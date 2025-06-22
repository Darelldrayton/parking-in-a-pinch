"""
URL patterns for location app.
"""
from django.urls import path
from . import api_views

app_name = 'location'

urlpatterns = [
    # Check-in/Check-out
    path('checkin/', api_views.checkin_location, name='checkin'),
    path('checkout/', api_views.checkout_location, name='checkout'),
    path('checkin-status/<int:booking_id>/', api_views.get_checkin_status, name='checkin-status'),
    path('validate/', api_views.validate_location, name='validate-location'),
    
    # Location tracking
    path('track/', api_views.track_location, name='track-location'),
    path('history/', api_views.location_history, name='location-history'),
    path('analytics/', api_views.location_analytics, name='location-analytics'),
    
    # Emergency features
    path('emergency-alert/', api_views.emergency_alert, name='emergency-alert'),
    
    # Privacy settings
    path('privacy-settings/', api_views.location_privacy_settings, name='privacy-settings'),
    
    # Geofences
    path('nearby-geofences/', api_views.nearby_geofences, name='nearby-geofences'),
]