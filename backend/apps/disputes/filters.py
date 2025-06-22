"""
Filters for dispute models.
"""
import django_filters
from .models import Dispute


class DisputeFilter(django_filters.FilterSet):
    """
    Filter for disputes.
    """
    dispute_type = django_filters.ChoiceFilter(choices=Dispute.DisputeType.choices)
    status = django_filters.ChoiceFilter(choices=Dispute.DisputeStatus.choices)
    priority = django_filters.ChoiceFilter(choices=Dispute.Priority.choices)
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')
    
    class Meta:
        model = Dispute
        fields = ['dispute_type', 'status', 'priority', 'assigned_to']