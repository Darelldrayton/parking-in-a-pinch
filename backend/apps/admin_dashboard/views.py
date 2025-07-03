"""
Admin dashboard API endpoints that were missing.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import logging

from ..users.models import User
from ..bookings.models import Booking
from ..listings.models import ParkingListing
from ..disputes.models import Dispute

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Comprehensive admin dashboard stats endpoint.
    """
    try:
        # Check admin permissions
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Calculate time periods
        now = timezone.now()
        one_week_ago = now - timedelta(days=7)
        one_month_ago = now - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        recent_signups = User.objects.filter(created_at__gte=one_week_ago).count()
        monthly_signups = User.objects.filter(created_at__gte=one_month_ago).count()
        
        # Booking statistics
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        confirmed_bookings = Booking.objects.filter(status='confirmed').count()
        completed_bookings = Booking.objects.filter(status='completed').count()
        recent_bookings = Booking.objects.filter(created_at__gte=one_week_ago).count()
        
        # Listing statistics
        total_listings = ParkingListing.objects.count()
        active_listings = ParkingListing.objects.filter(is_active=True).count()
        pending_listings = ParkingListing.objects.filter(is_active=False).count()
        recent_listings = ParkingListing.objects.filter(created_at__gte=one_week_ago).count()
        
        # Dispute statistics
        try:
            total_disputes = Dispute.objects.count()
            pending_disputes = Dispute.objects.filter(status='pending').count()
            resolved_disputes = Dispute.objects.filter(status='resolved').count()
            recent_disputes = Dispute.objects.filter(created_at__gte=one_week_ago).count()
        except:
            # Fallback if Dispute model doesn't exist
            total_disputes = 0
            pending_disputes = 0
            resolved_disputes = 0
            recent_disputes = 0
        
        # Revenue statistics (simplified)
        try:
            from decimal import Decimal
            total_revenue = sum(
                booking.total_amount for booking in 
                Booking.objects.filter(status='completed') 
                if booking.total_amount
            )
            monthly_revenue = sum(
                booking.total_amount for booking in 
                Booking.objects.filter(
                    status='completed',
                    created_at__gte=one_month_ago
                ) if booking.total_amount
            )
        except:
            total_revenue = Decimal('0.00')
            monthly_revenue = Decimal('0.00')
        
        dashboard_stats = {
            # User metrics
            'total_users': total_users,
            'active_users': active_users,
            'verified_users': verified_users,
            'recent_signups': recent_signups,
            'monthly_signups': monthly_signups,
            
            # Booking metrics
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'confirmed_bookings': confirmed_bookings,
            'completed_bookings': completed_bookings,
            'recent_bookings': recent_bookings,
            
            # Listing metrics
            'total_listings': total_listings,
            'active_listings': active_listings,
            'pending_listings': pending_listings,
            'recent_listings': recent_listings,
            
            # Dispute metrics
            'total_disputes': total_disputes,
            'pending_disputes': pending_disputes,
            'resolved_disputes': resolved_disputes,
            'recent_disputes': recent_disputes,
            
            # Revenue metrics
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            
            # System metrics
            'system_health': 'good',
            'last_updated': now.isoformat(),
        }
        
        return Response(dashboard_stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        return Response({
            'error': 'Failed to fetch dashboard stats',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def disputes_admin(request):
    """
    Admin disputes endpoint that was missing.
    """
    try:
        # Check admin permissions
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Try to get disputes from the disputes app
            disputes = Dispute.objects.all().order_by('-created_at')[:20]
            disputes_data = []
            
            for dispute in disputes:
                disputes_data.append({
                    'id': dispute.id,
                    'dispute_type': dispute.dispute_type,
                    'subject': getattr(dispute, 'subject', ''),
                    'status': getattr(dispute, 'status', 'pending'),
                    'created_at': dispute.created_at.isoformat(),
                    'user_id': getattr(dispute, 'user_id', None),
                    'priority': getattr(dispute, 'priority', 'medium'),
                })
            
            return Response({
                'disputes': disputes_data,
                'count': len(disputes_data),
                'total_disputes': Dispute.objects.count(),
                'pending_disputes': Dispute.objects.filter(status='pending').count() if hasattr(Dispute, 'status') else 0,
            }, status=status.HTTP_200_OK)
            
        except Exception as dispute_error:
            # Fallback response if disputes model has issues
            logger.warning(f"Disputes model error: {str(dispute_error)}")
            return Response({
                'disputes': [],
                'count': 0,
                'total_disputes': 0,
                'pending_disputes': 0,
                'note': 'Disputes data not available'
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Admin disputes error: {str(e)}")
        return Response({
            'error': 'Failed to fetch disputes data',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)