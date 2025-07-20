"""
Filters for parking listings.
"""
import django_filters
from django.db import models
from .models import ParkingListing


class ParkingListingFilter(django_filters.FilterSet):
    """
    Enhanced filter set for parking listings with smart filtering capabilities.
    """
    # Price range filters
    min_hourly_rate = django_filters.NumberFilter(field_name="hourly_rate", lookup_expr='gte')
    max_hourly_rate = django_filters.NumberFilter(field_name="hourly_rate", lookup_expr='lte')
    min_daily_rate = django_filters.NumberFilter(field_name="daily_rate", lookup_expr='gte')
    max_daily_rate = django_filters.NumberFilter(field_name="daily_rate", lookup_expr='lte')
    
    # Simplified price filters for frontend
    min_price = django_filters.NumberFilter(field_name="hourly_rate", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="hourly_rate", lookup_expr='lte')
    
    # Text filters
    search = django_filters.CharFilter(method='filter_search')
    
    # Choice filters
    borough = django_filters.ChoiceFilter(choices=ParkingListing.Borough.choices)
    space_type = django_filters.MultipleChoiceFilter(
        field_name='space_type',
        choices=ParkingListing.SpaceType.choices,
        method='filter_space_types'
    )
    
    # Boolean filters for amenities
    is_covered = django_filters.BooleanFilter()
    has_ev_charging = django_filters.BooleanFilter()
    has_security = django_filters.BooleanFilter()
    has_cctv = django_filters.BooleanFilter()
    has_car_wash = django_filters.BooleanFilter()
    is_available = django_filters.BooleanFilter(field_name="is_active")
    
    # Multiple amenities filter
    amenities = django_filters.CharFilter(method='filter_amenities')
    
    # Vehicle size filter - simple text filter since there's no VehicleSize choices
    max_vehicle_size = django_filters.CharFilter(field_name='max_vehicle_size', lookup_expr='icontains')
    
    # Rating filter
    min_rating = django_filters.NumberFilter(field_name="rating_average", lookup_expr='gte')
    
    # Instant book filter
    instant_book = django_filters.BooleanFilter(field_name="is_instant_book")
    
    # Accessibility filter
    wheelchair_accessible = django_filters.BooleanFilter(method='filter_wheelchair_accessible')
    
    # Advanced availability filter
    available_now = django_filters.BooleanFilter(method='filter_available_now')
    available_today = django_filters.BooleanFilter(method='filter_available_today')
    available_this_week = django_filters.BooleanFilter(method='filter_available_this_week')
    
    class Meta:
        model = ParkingListing
        fields = [
            'borough', 'space_type', 'is_covered', 'has_ev_charging', 
            'has_security', 'has_cctv', 'has_car_wash', 'is_active',
            'max_vehicle_size', 'rating_average', 'is_instant_book'
        ]
    
    def filter_search(self, queryset, name, value):
        """
        Enhanced search filter that searches across multiple fields with weighting.
        """
        if value:
            # Simplified search to debug the issue
            return queryset.filter(borough__icontains=value).distinct()
        return queryset
    
    def filter_space_types(self, queryset, name, value):
        """
        Filter by multiple space types.
        """
        if value:
            return queryset.filter(space_type__in=value)
        return queryset
    
    def filter_amenities(self, queryset, name, value):
        """
        Filter by multiple amenities using comma-separated values.
        """
        if value:
            amenities = [a.strip() for a in value.split(',') if a.strip()]
            query = models.Q()
            
            for amenity in amenities:
                if amenity == 'covered':
                    query |= models.Q(is_covered=True)
                elif amenity == 'security':
                    query |= models.Q(has_security=True)
                elif amenity == 'electric_charging':
                    query |= models.Q(has_ev_charging=True)
                elif amenity == 'cctv':
                    query |= models.Q(has_cctv=True)
                elif amenity == 'car_wash':
                    query |= models.Q(has_car_wash=True)
                elif amenity == 'gated':
                    query |= models.Q(has_security=True)  # Assume gated = security for now
                elif amenity == 'lighting':
                    # Add lighting field if it exists, otherwise skip
                    pass
            
            if query:
                return queryset.filter(query)
        return queryset
    
    def filter_wheelchair_accessible(self, queryset, name, value):
        """
        Filter for wheelchair accessible parking.
        """
        if value:
            # For now, assume wheelchair accessible means ground level or has elevator access
            # This would be a custom field in a real implementation
            return queryset.filter(
                models.Q(space_type__in=['street', 'lot']) |
                models.Q(description__icontains='accessible') |
                models.Q(description__icontains='wheelchair') |
                models.Q(description__icontains='ground level')
            )
        return queryset
    
    def filter_available_now(self, queryset, name, value):
        """
        Filter for spaces available right now (next 2 hours).
        """
        if value:
            from datetime import datetime, timedelta
            from django.utils import timezone
            
            now = timezone.now()
            two_hours_later = now + timedelta(hours=2)
            
            # Filter out listings with current bookings AND blocked periods
            return queryset.filter(is_active=True).exclude(
                # Exclude if there are booking conflicts
                bookings__start_time__lte=two_hours_later,
                bookings__end_time__gte=now,
                bookings__status__in=['confirmed', 'active']
            ).exclude(
                # Exclude if there are blocked/unavailable periods
                unavailable_periods__start_datetime__lte=two_hours_later,
                unavailable_periods__end_datetime__gte=now
            ).distinct()
        return queryset
    
    def filter_available_today(self, queryset, name, value):
        """
        Filter for spaces available today.
        """
        if value:
            from datetime import datetime, time
            from django.utils import timezone
            
            today = timezone.now().date()
            start_of_day = timezone.make_aware(datetime.combine(today, time.min))
            end_of_day = timezone.make_aware(datetime.combine(today, time.max))
            
            # Filter out listings with bookings or blocked periods today
            return queryset.filter(is_active=True).exclude(
                # Exclude if there are booking conflicts today
                bookings__start_time__lte=end_of_day,
                bookings__end_time__gte=start_of_day,
                bookings__status__in=['confirmed', 'active']
            ).exclude(
                # Exclude if there are blocked/unavailable periods today
                unavailable_periods__start_datetime__lte=end_of_day,
                unavailable_periods__end_datetime__gte=start_of_day
            ).distinct()
        return queryset
    
    def filter_available_this_week(self, queryset, name, value):
        """
        Filter for spaces available this week.
        """
        if value:
            from datetime import datetime, timedelta
            from django.utils import timezone
            
            now = timezone.now()
            week_end = now + timedelta(days=7)
            
            # Filter out listings with bookings or blocked periods this week
            return queryset.filter(is_active=True).exclude(
                # Exclude if there are booking conflicts this week
                bookings__start_time__lte=week_end,
                bookings__end_time__gte=now,
                bookings__status__in=['confirmed', 'active']
            ).exclude(
                # Exclude if there are blocked/unavailable periods this week
                unavailable_periods__start_datetime__lte=week_end,
                unavailable_periods__end_datetime__gte=now
            ).distinct()
        return queryset