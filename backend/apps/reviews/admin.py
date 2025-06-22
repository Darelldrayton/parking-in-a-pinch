"""
Django admin configuration for the reviews app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    Review, ReviewImage, ReviewVote, ReviewFlag, ReviewTemplate,
    ReviewType, ReviewStatus
)


class ReviewImageInline(admin.TabularInline):
    """Inline admin for review images."""
    model = ReviewImage
    extra = 0
    readonly_fields = ['image_preview']
    fields = ['image', 'image_preview', 'alt_text', 'display_order', 'is_approved']
    
    def image_preview(self, obj):
        """Display image preview in admin."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"


class ReviewVoteInline(admin.TabularInline):
    """Inline admin for review votes."""
    model = ReviewVote
    extra = 0
    readonly_fields = ['voter', 'vote_type', 'created_at']
    can_delete = False
    
    def has_add_permission(self, request, obj):
        return False


class ReviewFlagInline(admin.TabularInline):
    """Inline admin for review flags."""
    model = ReviewFlag
    extra = 0
    readonly_fields = ['flagger', 'reason', 'description', 'created_at']
    fields = ['flagger', 'reason', 'description', 'is_resolved', 'resolved_by', 'resolution_notes']
    
    def has_add_permission(self, request, obj):
        return False


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for reviews."""
    
    list_display = [
        'review_id', 'reviewer_name', 'review_type', 'overall_rating',
        'status', 'is_verified', 'helpful_score', 'flagged_count',
        'created_at'
    ]
    list_filter = [
        'review_type', 'status', 'is_verified', 'is_anonymous',
        'overall_rating', 'created_at'
    ]
    search_fields = [
        'review_id', 'reviewer__email', 'reviewer__first_name',
        'reviewer__last_name', 'title', 'comment'
    ]
    readonly_fields = [
        'review_id', 'helpful_score', 'total_votes', 'helpful_percentage',
        'created_at', 'updated_at', 'published_at'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'review_id', 'reviewer', 'review_type', 'booking',
                'status', 'is_verified', 'is_anonymous'
            )
        }),
        ('Content', {
            'fields': ('title', 'comment')
        }),
        ('Ratings', {
            'fields': (
                'overall_rating', 'cleanliness_rating', 'location_rating',
                'value_rating', 'communication_rating', 'security_rating',
                'reliability_rating'
            )
        }),
        ('Engagement', {
            'fields': (
                'helpful_votes', 'unhelpful_votes', 'helpful_score',
                'total_votes', 'helpful_percentage'
            )
        }),
        ('Moderation', {
            'fields': (
                'flagged_count', 'moderated_by', 'moderation_notes'
            )
        }),
        ('Response', {
            'fields': ('response_text', 'response_date'),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ['collapse']
        })
    )
    inlines = [ReviewImageInline, ReviewVoteInline, ReviewFlagInline]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def reviewer_name(self, obj):
        """Display reviewer name."""
        if obj.is_anonymous:
            return "Anonymous"
        return obj.reviewer.get_display_name()
    reviewer_name.short_description = "Reviewer"
    reviewer_name.admin_order_field = 'reviewer__first_name'
    
    def helpful_score(self, obj):
        """Display helpful score with color coding."""
        score = obj.helpful_score
        if score > 0:
            color = 'green'
        elif score < 0:
            color = 'red'
        else:
            color = 'gray'
        
        return format_html(
            '<span style="color: {};">{}</span>',
            color, score
        )
    helpful_score.short_description = "Helpful Score"
    helpful_score.admin_order_field = 'helpful_votes'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related(
            'reviewer', 'booking', 'moderated_by'
        )
    
    actions = ['approve_reviews', 'reject_reviews', 'hide_reviews']
    
    def approve_reviews(self, request, queryset):
        """Bulk approve reviews."""
        updated = queryset.update(
            status=ReviewStatus.APPROVED,
            moderated_by=request.user
        )
        self.message_user(request, f'{updated} reviews approved.')
    approve_reviews.short_description = "Approve selected reviews"
    
    def reject_reviews(self, request, queryset):
        """Bulk reject reviews."""
        updated = queryset.update(
            status=ReviewStatus.REJECTED,
            moderated_by=request.user
        )
        self.message_user(request, f'{updated} reviews rejected.')
    reject_reviews.short_description = "Reject selected reviews"
    
    def hide_reviews(self, request, queryset):
        """Bulk hide reviews."""
        updated = queryset.update(
            status=ReviewStatus.HIDDEN,
            moderated_by=request.user
        )
        self.message_user(request, f'{updated} reviews hidden.')
    hide_reviews.short_description = "Hide selected reviews"


@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    """Admin interface for review images."""
    
    list_display = [
        'id', 'review_link', 'image_preview', 'display_order',
        'is_approved', 'uploaded_at'
    ]
    list_filter = ['is_approved', 'uploaded_at']
    search_fields = ['review__review_id', 'alt_text']
    readonly_fields = ['image_preview', 'uploaded_at']
    list_editable = ['display_order', 'is_approved']
    
    def review_link(self, obj):
        """Link to the related review."""
        url = reverse('admin:reviews_review_change', args=[obj.review.pk])
        return format_html('<a href="{}">{}</a>', url, obj.review.review_id)
    review_link.short_description = "Review"
    
    def image_preview(self, obj):
        """Display image preview."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 300px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"


@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    """Admin interface for review votes."""
    
    list_display = [
        'id', 'review_link', 'voter_name', 'vote_type', 'created_at'
    ]
    list_filter = ['vote_type', 'created_at']
    search_fields = [
        'review__review_id', 'voter__email', 'voter__first_name',
        'voter__last_name'
    ]
    readonly_fields = ['created_at']
    
    def review_link(self, obj):
        """Link to the related review."""
        url = reverse('admin:reviews_review_change', args=[obj.review.pk])
        return format_html('<a href="{}">{}</a>', url, obj.review.review_id)
    review_link.short_description = "Review"
    
    def voter_name(self, obj):
        """Display voter name."""
        return obj.voter.get_display_name()
    voter_name.short_description = "Voter"
    voter_name.admin_order_field = 'voter__first_name'


@admin.register(ReviewFlag)
class ReviewFlagAdmin(admin.ModelAdmin):
    """Admin interface for review flags."""
    
    list_display = [
        'id', 'review_link', 'flagger_name', 'reason',
        'is_resolved', 'created_at'
    ]
    list_filter = ['reason', 'is_resolved', 'created_at']
    search_fields = [
        'review__review_id', 'flagger__email', 'description'
    ]
    readonly_fields = ['created_at', 'resolved_at']
    fieldsets = (
        ('Flag Information', {
            'fields': ('review', 'flagger', 'reason', 'description')
        }),
        ('Resolution', {
            'fields': (
                'is_resolved', 'resolved_by', 'resolution_notes',
                'resolved_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ['collapse']
        })
    )
    
    def review_link(self, obj):
        """Link to the related review."""
        url = reverse('admin:reviews_review_change', args=[obj.review.pk])
        return format_html('<a href="{}">{}</a>', url, obj.review.review_id)
    review_link.short_description = "Review"
    
    def flagger_name(self, obj):
        """Display flagger name."""
        return obj.flagger.get_display_name()
    flagger_name.short_description = "Flagger"
    flagger_name.admin_order_field = 'flagger__first_name'
    
    def save_model(self, request, obj, form, change):
        """Set resolved_at when flag is resolved."""
        if obj.is_resolved and not obj.resolved_at:
            from django.utils import timezone
            obj.resolved_at = timezone.now()
            if not obj.resolved_by:
                obj.resolved_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ReviewTemplate)
class ReviewTemplateAdmin(admin.ModelAdmin):
    """Admin interface for review templates."""
    
    list_display = [
        'name', 'review_type', 'template_type', 'suggested_rating',
        'usage_count', 'is_active', 'created_at'
    ]
    list_filter = [
        'review_type', 'template_type', 'is_active', 'suggested_rating'
    ]
    search_fields = ['name', 'title_template', 'comment_template']
    readonly_fields = ['usage_count', 'created_at']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'name', 'review_type', 'template_type',
                'suggested_rating', 'is_active'
            )
        }),
        ('Template Content', {
            'fields': ('title_template', 'comment_template')
        }),
        ('Statistics', {
            'fields': ('usage_count', 'created_at'),
            'classes': ['collapse']
        })
    )


# Register admin site customizations
admin.site.site_header = "Parking in a Pinch - Reviews Administration"
admin.site.site_title = "Reviews Admin"
admin.site.index_title = "Reviews Management"