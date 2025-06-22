"""
Filters for the reviews app - Advanced filtering capabilities for reviews.
"""
import django_filters
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType

from .models import Review, ReviewType, ReviewStatus
from apps.listings.models import ParkingListing
from apps.users.models import User


class ReviewFilter(django_filters.FilterSet):
    """
    Advanced filter set for reviews with multiple filtering options.
    """
    
    # Basic filters
    review_type = django_filters.ChoiceFilter(
        choices=ReviewType.choices,
        help_text="Filter by review type (listing, host, renter)"
    )
    
    status = django_filters.ChoiceFilter(
        choices=ReviewStatus.choices,
        help_text="Filter by review status"
    )
    
    is_verified = django_filters.BooleanFilter(
        help_text="Filter by verification status"
    )
    
    is_anonymous = django_filters.BooleanFilter(
        help_text="Filter by anonymous status"
    )
    
    # Rating filters
    overall_rating = django_filters.NumberFilter(
        help_text="Filter by exact overall rating"
    )
    
    overall_rating__gte = django_filters.NumberFilter(
        field_name='overall_rating',
        lookup_expr='gte',
        help_text="Minimum overall rating"
    )
    
    overall_rating__lte = django_filters.NumberFilter(
        field_name='overall_rating',
        lookup_expr='lte',
        help_text="Maximum overall rating"
    )
    
    min_rating = django_filters.NumberFilter(
        method='filter_min_rating',
        help_text="Minimum overall rating (alias for overall_rating__gte)"
    )
    
    max_rating = django_filters.NumberFilter(
        method='filter_max_rating',
        help_text="Maximum overall rating (alias for overall_rating__lte)"
    )
    
    # Specific rating filters
    cleanliness_rating__gte = django_filters.NumberFilter(
        field_name='cleanliness_rating',
        lookup_expr='gte',
        help_text="Minimum cleanliness rating"
    )
    
    location_rating__gte = django_filters.NumberFilter(
        field_name='location_rating',
        lookup_expr='gte',
        help_text="Minimum location rating"
    )
    
    value_rating__gte = django_filters.NumberFilter(
        field_name='value_rating',
        lookup_expr='gte',
        help_text="Minimum value rating"
    )
    
    communication_rating__gte = django_filters.NumberFilter(
        field_name='communication_rating',
        lookup_expr='gte',
        help_text="Minimum communication rating"
    )
    
    security_rating__gte = django_filters.NumberFilter(
        field_name='security_rating',
        lookup_expr='gte',
        help_text="Minimum security rating"
    )
    
    reliability_rating__gte = django_filters.NumberFilter(
        field_name='reliability_rating',
        lookup_expr='gte',
        help_text="Minimum reliability rating"
    )
    
    # Date filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text="Reviews created after this date"
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text="Reviews created before this date"
    )
    
    date_range = django_filters.DateFromToRangeFilter(
        field_name='created_at',
        help_text="Date range for review creation"
    )
    
    # Engagement filters
    min_helpful_votes = django_filters.NumberFilter(
        field_name='helpful_votes',
        lookup_expr='gte',
        help_text="Minimum number of helpful votes"
    )
    
    min_helpful_score = django_filters.NumberFilter(
        method='filter_min_helpful_score',
        help_text="Minimum helpful score (helpful - unhelpful votes)"
    )
    
    has_images = django_filters.BooleanFilter(
        method='filter_has_images',
        help_text="Filter reviews that have images"
    )
    
    has_response = django_filters.BooleanFilter(
        method='filter_has_response',
        help_text="Filter reviews that have responses"
    )
    
    # Object-specific filters
    listing_id = django_filters.NumberFilter(
        method='filter_listing_id',
        help_text="Filter reviews for a specific listing"
    )
    
    host_id = django_filters.NumberFilter(
        method='filter_host_id',
        help_text="Filter reviews for a specific host"
    )
    
    renter_id = django_filters.NumberFilter(
        method='filter_renter_id',
        help_text="Filter reviews for a specific renter"
    )
    
    reviewer_id = django_filters.NumberFilter(
        field_name='reviewer__id',
        help_text="Filter by reviewer ID"
    )
    
    # Location-based filters (for listing reviews)
    borough = django_filters.CharFilter(
        method='filter_by_borough',
        help_text="Filter listing reviews by borough"
    )
    
    space_type = django_filters.CharFilter(
        method='filter_by_space_type',
        help_text="Filter listing reviews by space type"
    )
    
    # Text search
    search = django_filters.CharFilter(
        method='filter_search',
        help_text="Search in review title and comment"
    )
    
    # Moderation filters
    flagged = django_filters.BooleanFilter(
        method='filter_flagged',
        help_text="Filter flagged reviews"
    )
    
    min_flag_count = django_filters.NumberFilter(
        field_name='flagged_count',
        lookup_expr='gte',
        help_text="Minimum number of flags"
    )
    
    # Ordering
    ordering = django_filters.OrderingFilter(
        fields=(
            ('created_at', 'created_at'),
            ('overall_rating', 'rating'),
            ('helpful_votes', 'helpful_votes'),
            ('helpful_score', 'helpful_score'),
            ('flagged_count', 'flagged_count'),
        ),
        field_labels={
            'created_at': 'Creation Date',
            'overall_rating': 'Rating',
            'helpful_votes': 'Helpful Votes',
            'helpful_score': 'Helpful Score',
            'flagged_count': 'Flag Count',
        }
    )
    
    class Meta:
        model = Review
        fields = [
            'review_type', 'status', 'is_verified', 'is_anonymous',
            'overall_rating', 'reviewer_id'
        ]
    
    def filter_min_rating(self, queryset, name, value):
        """Filter by minimum overall rating."""
        if value is not None:
            return queryset.filter(overall_rating__gte=value)
        return queryset
    
    def filter_max_rating(self, queryset, name, value):
        """Filter by maximum overall rating."""
        if value is not None:
            return queryset.filter(overall_rating__lte=value)
        return queryset
    
    def filter_min_helpful_score(self, queryset, name, value):
        """Filter by minimum helpful score."""
        if value is not None:
            # Helpful score = helpful_votes - unhelpful_votes
            return queryset.extra(
                where=["helpful_votes - unhelpful_votes >= %s"],
                params=[value]
            )
        return queryset
    
    def filter_has_images(self, queryset, name, value):
        """Filter reviews that have images."""
        if value is True:
            return queryset.filter(images__isnull=False).distinct()
        elif value is False:
            return queryset.filter(images__isnull=True)
        return queryset
    
    def filter_has_response(self, queryset, name, value):
        """Filter reviews that have responses."""
        if value is True:
            return queryset.exclude(response_text='')
        elif value is False:
            return queryset.filter(Q(response_text='') | Q(response_text__isnull=True))
        return queryset
    
    def filter_listing_id(self, queryset, name, value):
        """Filter reviews for a specific listing."""
        if value is not None:
            listing_content_type = ContentType.objects.get_for_model(ParkingListing)
            return queryset.filter(
                content_type=listing_content_type,
                object_id=value,
                review_type=ReviewType.LISTING
            )
        return queryset
    
    def filter_host_id(self, queryset, name, value):
        """Filter reviews for a specific host."""
        if value is not None:
            user_content_type = ContentType.objects.get_for_model(User)
            return queryset.filter(
                content_type=user_content_type,
                object_id=value,
                review_type=ReviewType.HOST
            )
        return queryset
    
    def filter_renter_id(self, queryset, name, value):
        """Filter reviews for a specific renter."""
        if value is not None:
            user_content_type = ContentType.objects.get_for_model(User)
            return queryset.filter(
                content_type=user_content_type,
                object_id=value,
                review_type=ReviewType.RENTER
            )
        return queryset
    
    def filter_by_borough(self, queryset, name, value):
        """Filter listing reviews by borough."""
        if value:
            listing_content_type = ContentType.objects.get_for_model(ParkingListing)
            listing_ids = ParkingListing.objects.filter(
                borough__icontains=value
            ).values_list('id', flat=True)
            
            return queryset.filter(
                content_type=listing_content_type,
                object_id__in=listing_ids,
                review_type=ReviewType.LISTING
            )
        return queryset
    
    def filter_by_space_type(self, queryset, name, value):
        """Filter listing reviews by space type."""
        if value:
            listing_content_type = ContentType.objects.get_for_model(ParkingListing)
            listing_ids = ParkingListing.objects.filter(
                space_type__icontains=value
            ).values_list('id', flat=True)
            
            return queryset.filter(
                content_type=listing_content_type,
                object_id__in=listing_ids,
                review_type=ReviewType.LISTING
            )
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Search in review title and comment."""
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(comment__icontains=value)
            )
        return queryset
    
    def filter_flagged(self, queryset, name, value):
        """Filter flagged reviews."""
        if value is True:
            return queryset.filter(
                Q(status=ReviewStatus.FLAGGED) | Q(flagged_count__gt=0)
            )
        elif value is False:
            return queryset.filter(flagged_count=0)
        return queryset


class ReviewDateFilter(django_filters.FilterSet):
    """
    Simple date-based filter for reviews.
    """
    
    year = django_filters.NumberFilter(
        field_name='created_at__year',
        help_text="Filter by year"
    )
    
    month = django_filters.NumberFilter(
        field_name='created_at__month',
        help_text="Filter by month (1-12)"
    )
    
    week = django_filters.NumberFilter(
        field_name='created_at__week',
        help_text="Filter by week of year"
    )
    
    last_days = django_filters.NumberFilter(
        method='filter_last_days',
        help_text="Reviews from last N days"
    )
    
    class Meta:
        model = Review
        fields = []
    
    def filter_last_days(self, queryset, name, value):
        """Filter reviews from last N days."""
        if value is not None and value > 0:
            from django.utils import timezone
            from datetime import timedelta
            
            cutoff_date = timezone.now() - timedelta(days=value)
            return queryset.filter(created_at__gte=cutoff_date)
        return queryset


class ReviewRatingFilter(django_filters.FilterSet):
    """
    Specialized filter for rating-based queries.
    """
    
    excellent = django_filters.BooleanFilter(
        method='filter_excellent',
        help_text="5-star reviews only"
    )
    
    good = django_filters.BooleanFilter(
        method='filter_good',
        help_text="4-5 star reviews"
    )
    
    average = django_filters.BooleanFilter(
        method='filter_average',
        help_text="3 star reviews"
    )
    
    poor = django_filters.BooleanFilter(
        method='filter_poor',
        help_text="1-2 star reviews"
    )
    
    rating_range = django_filters.RangeFilter(
        field_name='overall_rating',
        help_text="Rating range (e.g., 3-5)"
    )
    
    class Meta:
        model = Review
        fields = []
    
    def filter_excellent(self, queryset, name, value):
        """Filter 5-star reviews."""
        if value is True:
            return queryset.filter(overall_rating=5)
        return queryset
    
    def filter_good(self, queryset, name, value):
        """Filter 4-5 star reviews."""
        if value is True:
            return queryset.filter(overall_rating__gte=4)
        return queryset
    
    def filter_average(self, queryset, name, value):
        """Filter 3 star reviews."""
        if value is True:
            return queryset.filter(overall_rating=3)
        return queryset
    
    def filter_poor(self, queryset, name, value):
        """Filter 1-2 star reviews."""
        if value is True:
            return queryset.filter(overall_rating__lte=2)
        return queryset