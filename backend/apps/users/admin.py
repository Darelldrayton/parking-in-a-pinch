"""
Admin configuration for the users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.http import HttpResponse
import csv
from datetime import datetime
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for the custom User model."""
    
    list_display = (
        'email', 'username', 'first_name', 'last_name', 
        'user_type', 'is_email_verified', 'is_identity_verified',
        'subscribe_to_newsletter', 'created_at', 'is_active'
    )
    list_filter = (
        'user_type', 'is_email_verified', 'is_phone_verified', 
        'is_identity_verified', 'subscribe_to_newsletter', 'is_active', 
        'is_staff', 'created_at'
    )
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('username', 'email', 'password')
        }),
        (_('Personal info'), {
            'fields': (
                'first_name', 'last_name', 'phone_number', 
                'profile_picture', 'bio', 'date_of_birth'
            )
        }),
        (_('Account type'), {
            'fields': ('user_type',)
        }),
        (_('Verification'), {
            'fields': (
                'is_email_verified', 'is_phone_verified', 
                'is_identity_verified', 'driver_license_number', 
                'driver_license_state'
            )
        }),
        (_('Location'), {
            'fields': ('default_location', 'default_address')
        }),
        (_('Payment'), {
            'fields': ('stripe_customer_id', 'stripe_account_id')
        }),
        (_('Preferences'), {
            'fields': ('preferred_notification_method', 'subscribe_to_newsletter')
        }),
        (_('Ratings'), {
            'fields': (
                'average_rating_as_host', 'total_reviews_as_host',
                'average_rating_as_guest', 'total_reviews_as_guest'
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser', 
                'groups', 'user_permissions'
            )
        }),
        (_('Important dates'), {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')
        }),
        (_('Soft delete'), {
            'fields': ('is_deleted', 'deleted_at')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'user_type'
            ),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    actions = ['export_to_csv', 'export_subscribers_to_csv']
    
    def export_to_csv(self, request, queryset):
        """Export selected users to CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="users_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        # Header row
        writer.writerow([
            'ID', 'Email', 'First Name', 'Last Name', 'Username',
            'Phone Number', 'User Type', 'Email Verified', 'Identity Verified',
            'Newsletter Subscriber', 'Created Date', 'Last Login', 'Active'
        ])
        
        # Data rows
        for user in queryset:
            writer.writerow([
                user.id,
                user.email,
                user.first_name,
                user.last_name,
                user.username,
                user.phone_number or '',
                user.get_user_type_display(),
                'Yes' if user.is_email_verified else 'No',
                'Yes' if user.is_identity_verified else 'No',
                'Yes' if user.subscribe_to_newsletter else 'No',
                user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else '',
                user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never',
                'Yes' if user.is_active else 'No'
            ])
        
        return response
    
    export_to_csv.short_description = "Export selected users to CSV"
    
    def export_subscribers_to_csv(self, request, queryset):
        """Export newsletter subscribers to CSV."""
        # Filter only subscribers
        subscribers = queryset.filter(subscribe_to_newsletter=True, is_active=True)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="newsletter_subscribers_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        # Header row
        writer.writerow([
            'Email', 'First Name', 'Last Name', 'User Type',
            'Joined Date', 'Email Verified'
        ])
        
        # Data rows
        for user in subscribers:
            writer.writerow([
                user.email,
                user.first_name,
                user.last_name,
                user.get_user_type_display(),
                user.created_at.strftime('%Y-%m-%d') if user.created_at else '',
                'Yes' if user.is_email_verified else 'No'
            ])
        
        return response
    
    export_subscribers_to_csv.short_description = "Export newsletter subscribers to CSV"
    
    def get_queryset(self, request):
        """Filter out deleted users by default."""
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(is_deleted=False)
        return qs


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin interface for UserProfile model."""
    
    list_display = (
        'user', 'emergency_contact_name', 'primary_vehicle_make',
        'auto_approve_bookings', 'email_notifications'
    )
    list_filter = (
        'auto_approve_bookings', 'email_notifications', 
        'sms_notifications', 'push_notifications',
        'show_phone_to_guests', 'marketing_emails'
    )
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name',
        'emergency_contact_name', 'primary_vehicle_license_plate'
    )
    
    fieldsets = (
        (_('User'), {
            'fields': ('user',)
        }),
        (_('Emergency Contact'), {
            'fields': ('emergency_contact_name', 'emergency_contact_phone')
        }),
        (_('Vehicle Information'), {
            'fields': (
                'primary_vehicle_make', 'primary_vehicle_model',
                'primary_vehicle_year', 'primary_vehicle_color',
                'primary_vehicle_license_plate'
            )
        }),
        (_('Booking Preferences'), {
            'fields': ('auto_approve_bookings',)
        }),
        (_('Notification Preferences'), {
            'fields': (
                'email_notifications', 'sms_notifications', 
                'push_notifications'
            )
        }),
        (_('Privacy Settings'), {
            'fields': ('show_phone_to_guests', 'show_last_name')
        }),
        (_('Marketing'), {
            'fields': ('marketing_emails',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


# Customize the admin site header
admin.site.site_header = "Parking in a Pinch Administration"
admin.site.site_title = "Parking in a Pinch Admin"
admin.site.index_title = "Welcome to Parking in a Pinch Administration"