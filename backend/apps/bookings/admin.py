from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from .models import Booking, BookingReview


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_id', 'user', 'parking_space', 'status', 
        'start_time', 'end_time', 'total_amount', 'view_booking_detail', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'start_time']
    search_fields = ['booking_id', 'user__email', 'user__first_name', 'user__last_name', 
                    'parking_space__title', 'vehicle_license_plate']
    readonly_fields = ['booking_id', 'duration_hours', 'total_amount', 'platform_fee', 
                      'created_at', 'updated_at', 'actual_start_time', 'actual_end_time', 'view_booking_detail_link']
    date_hierarchy = 'created_at'
    actions = ['view_booking_details_action']
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('booking_id', 'user', 'parking_space', 'status', 'view_booking_detail_link')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration_hours')
        }),
        ('Pricing', {
            'fields': ('hourly_rate', 'total_amount', 'platform_fee')
        }),
        ('Vehicle Information', {
            'fields': ('vehicle_license_plate', 'vehicle_make_model')
        }),
        ('Additional Information', {
            'fields': ('special_instructions',)
        }),
        ('Check-in/Check-out Times', {
            'fields': ('actual_start_time', 'actual_end_time'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at'),
            'classes': ('collapse',)
        })
    )
    
    def view_booking_detail(self, obj):
        """Display a link to view the booking detail page"""
        url = f'/booking/{obj.id}'
        return format_html(
            '<a href="{}" target="_blank" style="color: #0073aa; text-decoration: none;">📋 View Detail</a>',
            url
        )
    view_booking_detail.short_description = 'Booking Detail'
    view_booking_detail.allow_tags = True
    
    def view_booking_detail_link(self, obj):
        """Display a link in the admin form"""
        if obj.id:
            url = f'/booking/{obj.id}'
            return format_html(
                '<a href="{}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #0073aa; color: white; text-decoration: none; border-radius: 4px;">📋 Open Booking Detail Page</a>',
                url
            )
        return "Save the booking first to view details"
    view_booking_detail_link.short_description = 'Booking Detail Page'
    view_booking_detail_link.allow_tags = True
    
    def view_booking_details_action(self, request, queryset):
        """Admin action to view booking details for selected bookings"""
        if queryset.count() == 1:
            booking = queryset.first()
            booking_detail_url = f'/booking/{booking.id}'
            return HttpResponseRedirect(booking_detail_url)
        else:
            self.message_user(request, 'Please select exactly one booking to view details.')
    view_booking_details_action.short_description = 'View booking detail page'
    
    def get_search_results(self, request, queryset, search_term):
        """Enhanced search to handle reservation number format"""
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        
        # If search term looks like a reservation number (e.g., BK679E4363 or #BK679E4363)
        if search_term:
            # Remove # if present and normalize
            clean_term = search_term.replace('#', '').replace('Reservation', '').strip()
            
            # Search for exact booking_id match
            if clean_term:
                exact_match = self.model.objects.filter(booking_id__iexact=clean_term)
                if exact_match.exists():
                    queryset = exact_match
                    use_distinct = True
        
        return queryset, use_distinct



@admin.register(BookingReview)
class BookingReviewAdmin(admin.ModelAdmin):
    list_display = [
        'booking', 'reviewer', 'rating', 'created_at'
    ]
    list_filter = ['rating', 'is_anonymous', 'created_at']
    search_fields = ['booking__booking_id', 'reviewer__email', 'reviewer__first_name', 'reviewer__last_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']