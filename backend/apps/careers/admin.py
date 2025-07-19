from django.contrib import admin
from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    """
    Admin interface for job applications.
    """
    list_display = [
        'name',
        'email',
        'position',
        'department',
        'status',
        'rating',
        'applied_date'
    ]
    list_filter = [
        'status',
        'department',
        'experience_level',
        'applied_date'
    ]
    search_fields = [
        'name',
        'email',
        'position'
    ]
    ordering = ['-applied_date']
    readonly_fields = ['applied_date', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'email', 'phone', 'location')
        }),
        ('Position Information', {
            'fields': ('position', 'department', 'experience_level')
        }),
        ('Application Details', {
            'fields': ('status', 'rating', 'applied_date')
        }),
        ('Additional Information', {
            'fields': ('linkedin', 'portfolio', 'cover_letter', 'resume')
        }),
        ('Admin', {
            'fields': ('reviewed_by', 'reviewed_at', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )