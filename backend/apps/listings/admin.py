"""
Admin configuration for parking listings.
"""
from django.contrib import admin
from .models import ParkingListing, ListingImage, ListingAvailability


class ListingImageInline(admin.TabularInline):
    """Inline admin for listing images."""
    model = ListingImage
    extra = 1
    fields = ['image', 'alt_text', 'display_order']


class ListingAvailabilityInline(admin.TabularInline):
    """Inline admin for listing availability."""
    model = ListingAvailability
    extra = 0
    fields = ['start_datetime', 'end_datetime', 'reason']


@admin.register(ParkingListing)
class ParkingListingAdmin(admin.ModelAdmin):
    """Admin configuration for parking listings."""
    list_display = [
        'title', 'host', 'borough', 'space_type', 'hourly_rate', 
        'daily_rate', 'is_active', 'rating_average', 'created_at'
    ]
    list_filter = [
        'borough', 'space_type', 'is_active', 'is_covered', 
        'has_ev_charging', 'has_security', 'created_at'
    ]
    search_fields = ['title', 'description', 'address', 'host__email']
    readonly_fields = ['created_at', 'updated_at', 'rating_average', 'total_reviews']
    inlines = [ListingImageInline, ListingAvailabilityInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('host', 'title', 'description')
        }),
        ('Location', {
            'fields': ('address', 'latitude', 'longitude', 'borough')
        }),
        ('Space Details', {
            'fields': ('space_type', 'max_vehicle_size', 'instructions')
        }),
        ('Pricing', {
            'fields': ('hourly_rate', 'daily_rate', 'weekly_rate')
        }),
        ('Amenities', {
            'fields': ('is_covered', 'has_ev_charging', 'has_security')
        }),
        ('Status & Statistics', {
            'fields': ('is_active', 'rating_average', 'total_reviews')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    """Admin configuration for listing images."""
    list_display = ['listing', 'alt_text', 'display_order', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['listing__title', 'alt_text']


@admin.register(ListingAvailability)
class ListingAvailabilityAdmin(admin.ModelAdmin):
    """Admin configuration for listing availability."""
    list_display = ['listing', 'start_datetime', 'end_datetime', 'reason']
    list_filter = ['start_datetime', 'end_datetime']
    search_fields = ['listing__title', 'reason']