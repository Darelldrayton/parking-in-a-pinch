import django_filters
from django.utils import timezone
from .models import Booking, BookingStatus


class BookingFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=BookingStatus.choices)
    start_date = django_filters.DateFilter(field_name='start_time__date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='end_time__date', lookup_expr='lte')
    parking_space = django_filters.NumberFilter(field_name='parking_space__id')
    min_amount = django_filters.NumberFilter(field_name='total_amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='total_amount', lookup_expr='lte')
    
    # Date range filters
    is_upcoming = django_filters.BooleanFilter(method='filter_upcoming')
    is_past = django_filters.BooleanFilter(method='filter_past')
    is_current = django_filters.BooleanFilter(method='filter_current')
    
    class Meta:
        model = Booking
        fields = ['status', 'parking_space', 'user']
    
    def filter_upcoming(self, queryset, name, value):
        if value:
            return queryset.filter(start_time__gt=timezone.now())
        return queryset
    
    def filter_past(self, queryset, name, value):
        if value:
            return queryset.filter(end_time__lt=timezone.now())
        return queryset
    
    def filter_current(self, queryset, name, value):
        if value:
            now = timezone.now()
            return queryset.filter(start_time__lte=now, end_time__gte=now)
        return queryset