"""
Custom admin dashboard views for refund management.
"""
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta

from .models import RefundRequest, Refund


@staff_member_required
def refund_dashboard(request):
    """
    Refund management dashboard showing statistics and pending requests.
    """
    now = timezone.now()
    today = now.date()
    thirty_days_ago = now - timedelta(days=30)
    
    # Get basic statistics
    stats = {
        'pending_requests': RefundRequest.objects.filter(status='pending').count(),
        'approved_today': RefundRequest.objects.filter(
            status__in=['approved', 'processed'],
            reviewed_at__date=today
        ).count(),
        'rejected_today': RefundRequest.objects.filter(
            status='rejected',
            reviewed_at__date=today
        ).count(),
        'total_refunded': Refund.objects.filter(
            status='succeeded',
            created_at__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0,
    }
    
    # Get pending requests
    pending_requests = RefundRequest.objects.filter(
        status='pending'
    ).select_related(
        'booking', 'requested_by', 'payment'
    ).order_by('-created_at')[:20]
    
    # Get recent requests (last 7 days)
    recent_requests = RefundRequest.objects.filter(
        created_at__gte=now - timedelta(days=7)
    ).exclude(
        status='pending'
    ).select_related(
        'booking', 'requested_by', 'reviewed_by'
    ).order_by('-reviewed_at')[:20]
    
    context = {
        'title': 'Refund Management Dashboard',
        'stats': stats,
        'pending_requests': pending_requests,
        'recent_requests': recent_requests,
    }
    
    return render(request, 'admin/payments/refund_dashboard.html', context)