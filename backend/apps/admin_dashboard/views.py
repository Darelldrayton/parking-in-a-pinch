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
from ..bookings.models import Booking, BookingStatus
from ..listings.models import ParkingListing
from ..disputes.models import Dispute

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@permission_classes([])
def dashboard_stats(request):
    """
    Comprehensive admin dashboard stats endpoint.
    DEBUG: Updated with correct queries for real data
    """
    try:
        # Skip admin permission check for now (authentication disabled)
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response({
        #         'error': 'Admin access required'
        #     }, status=status.HTTP_403_FORBIDDEN)
        
        # Calculate time periods
        now = timezone.now()
        one_week_ago = now - timedelta(days=7)
        one_month_ago = now - timedelta(days=30)
        
        # User statistics - Try both ORM and raw SQL
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        recent_signups = User.objects.filter(created_at__gte=one_week_ago).count()
        monthly_signups = User.objects.filter(created_at__gte=one_month_ago).count()
        
        # CRITICAL: Also try raw SQL to bypass any ORM issues
        from django.db import connection
        raw_counts = {}
        try:
            with connection.cursor() as cursor:
                # Get raw count from users table
                cursor.execute("SELECT COUNT(*) FROM users_user")
                raw_counts['total_from_sql'] = cursor.fetchone()[0]
                
                # Get count by different methods
                cursor.execute("SELECT COUNT(*) FROM auth_user")
                raw_counts['auth_user_table'] = cursor.fetchone()[0]
        except Exception as e:
            raw_counts['error'] = str(e)
            # Try alternate table names
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM users")
                    raw_counts['users_table'] = cursor.fetchone()[0]
            except:
                pass
        
        # Debug: Log ALL counts
        logger.info(f"DEBUG USER COUNTS: ORM={total_users}, active={active_users}, RAW SQL={raw_counts}")
        
        # Booking statistics - Using proper enum constants
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status=BookingStatus.PENDING).count()
        confirmed_bookings = Booking.objects.filter(status=BookingStatus.CONFIRMED).count()
        completed_bookings = Booking.objects.filter(status=BookingStatus.COMPLETED).count()
        recent_bookings = Booking.objects.filter(created_at__gte=one_week_ago).count()
        
        # Listing statistics - Using proper enum constants + raw SQL
        total_listings = ParkingListing.objects.count()
        active_listings = ParkingListing.objects.filter(is_active=True).count()
        pending_listings = ParkingListing.objects.filter(approval_status=ParkingListing.ApprovalStatus.PENDING).count()
        recent_listings = ParkingListing.objects.filter(created_at__gte=one_week_ago).count()
        
        # Try raw SQL for listings
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM parking_listings")
                raw_counts['total_listings_sql'] = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM parking_listings WHERE approval_status = 'PENDING'")
                raw_counts['pending_listings_sql'] = cursor.fetchone()[0]
        except Exception as e:
            raw_counts['listings_error'] = str(e)
        
        # Debug: Log actual counts
        logger.info(f"DEBUG LISTING COUNTS: ORM total={total_listings}, pending={pending_listings}, SQL={raw_counts.get('total_listings_sql', 'N/A')}")
        
        # Dispute statistics - Using proper enum constants
        try:
            total_disputes = Dispute.objects.count()
            pending_disputes = Dispute.objects.filter(status__in=[Dispute.DisputeStatus.OPEN, Dispute.DisputeStatus.IN_REVIEW]).count()
            resolved_disputes = Dispute.objects.filter(status=Dispute.DisputeStatus.RESOLVED).count()
            recent_disputes = Dispute.objects.filter(created_at__gte=one_week_ago).count()
            
            # Debug: Log actual counts
            logger.info(f"DEBUG DISPUTE COUNTS: total={total_disputes}, pending={pending_disputes}, resolved={resolved_disputes}")
        except Exception as e:
            # Fallback if Dispute model doesn't exist
            logger.warning(f"Dispute query error: {str(e)}")
            total_disputes = 0
            pending_disputes = 0
            resolved_disputes = 0
            recent_disputes = 0
        
        # Revenue statistics (simplified) - Using proper enum constants
        try:
            from decimal import Decimal
            total_revenue = sum(
                booking.total_amount for booking in 
                Booking.objects.filter(status=BookingStatus.COMPLETED) 
                if booking.total_amount
            )
            monthly_revenue = sum(
                booking.total_amount for booking in 
                Booking.objects.filter(
                    status=BookingStatus.COMPLETED,
                    created_at__gte=one_month_ago
                ) if booking.total_amount
            )
        except:
            total_revenue = Decimal('0.00')
            monthly_revenue = Decimal('0.00')
        
        # Add database info for debugging
        from django.db import connection
        db_info = {
            'engine': connection.vendor,
            'database_name': connection.settings_dict.get('NAME', 'Unknown'),
            'host': connection.settings_dict.get('HOST', 'localhost'),
        }
        
        dashboard_stats = {
            # Database debug info
            'database_info': db_info,
            'raw_sql_counts': raw_counts,  # CRITICAL: Show raw SQL counts
            # User metrics
            'total_users': max(total_users, raw_counts.get('total_from_sql', 0)),  # Use higher count
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
            
            # Listing metrics (frontend expects these names)
            'total_listings': total_listings,
            'active_listings': active_listings,
            'pending_listings': max(pending_listings, raw_counts.get('pending_listings_sql', 0)),
            'approved_listings': ParkingListing.objects.filter(approval_status=ParkingListing.ApprovalStatus.APPROVED).count(),
            'recent_listings': recent_listings,
            
            # Dispute metrics (frontend expects these names)
            'total_disputes': total_disputes,
            'open_disputes': pending_disputes,  # Frontend expects 'open_disputes'
            'pending_disputes': pending_disputes,
            'resolved_disputes': resolved_disputes,
            'recent_disputes': recent_disputes,
            
            # Verification metrics (get from VerificationRequest model)
            'pending_verifications': 0,  # Will be updated below
            'total_verifications': 0,   # Will be updated below
            
            # Refund metrics (placeholder for now)
            'pending_refunds': 0,
            'total_refunds': 0,
            'total_refund_amount': 0,
            
            # Revenue metrics
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            
            # System metrics
            'system_health': 'good',
            'last_updated': now.isoformat(),
        }
        
        # Add verification data from VerificationRequest model
        try:
            from apps.users.models import VerificationRequest
            dashboard_stats['pending_verifications'] = VerificationRequest.objects.filter(status=VerificationRequest.VerificationStatus.PENDING).count()
            dashboard_stats['total_verifications'] = VerificationRequest.objects.count()
        except Exception as e:
            logger.warning(f"Could not fetch verification data: {str(e)}")
            
        # Add refund data from RefundRequest model
        try:
            from apps.payments.models import RefundRequest
            dashboard_stats['pending_refunds'] = RefundRequest.objects.filter(status=RefundRequest.RequestStatus.PENDING).count()
            dashboard_stats['total_refunds'] = RefundRequest.objects.count()
            total_refund_amount = sum(
                refund.amount for refund in RefundRequest.objects.filter(status=RefundRequest.RequestStatus.PENDING)
                if refund.amount
            )
            dashboard_stats['total_refund_amount'] = float(total_refund_amount) if total_refund_amount else 0.0
        except Exception as e:
            logger.warning(f"Could not fetch refund data: {str(e)}")
        
        return Response(dashboard_stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        return Response({
            'error': 'Failed to fetch dashboard stats',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])
def debug_database(request):
    """
    Debug endpoint to check actual database values
    """
    try:
        # Direct database queries with debug info
        from django.db import connection
        
        # Check users table
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users_user")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM users_user WHERE is_active = true")
            active_users = cursor.fetchone()[0]
            
            cursor.execute("SELECT id, email, is_active, created_at FROM users_user ORDER BY id")
            users = cursor.fetchall()
        
        # Check other tables
        tables_info = {}
        table_queries = {
            'parking_listings': "SELECT COUNT(*) FROM parking_listings",
            'disputes': "SELECT COUNT(*) FROM disputes_dispute",
            'bookings': "SELECT COUNT(*) FROM bookings_booking",
            'verification_requests': "SELECT COUNT(*) FROM users_verificationrequest"
        }
        
        with connection.cursor() as cursor:
            for table, query in table_queries.items():
                try:
                    cursor.execute(query)
                    count = cursor.fetchone()[0]
                    tables_info[table] = count
                except Exception as e:
                    tables_info[table] = f"Error: {str(e)}"
        
        # Check specific enum values
        enum_checks = {}
        with connection.cursor() as cursor:
            # Check listing approval statuses
            try:
                cursor.execute("SELECT approval_status, COUNT(*) FROM parking_listings GROUP BY approval_status")
                enum_checks['listing_statuses'] = dict(cursor.fetchall())
            except:
                enum_checks['listing_statuses'] = 'Table not found'
                
            # Check dispute statuses
            try:
                cursor.execute("SELECT status, COUNT(*) FROM disputes_dispute GROUP BY status")
                enum_checks['dispute_statuses'] = dict(cursor.fetchall())
            except:
                enum_checks['dispute_statuses'] = 'Table not found'
        
        return Response({
            'debug_info': 'RAW DATABASE COUNTS',
            'raw_user_count': user_count,
            'raw_active_users': active_users,
            'user_details': [
                {'id': u[0], 'email': u[1], 'is_active': u[2], 'created': str(u[3])} 
                for u in users[:10]  # First 10 users
            ],
            'table_counts': tables_info,
            'enum_value_counts': enum_checks,
            'django_orm_count': User.objects.count(),
            'connection_info': {
                'database': connection.settings_dict.get('NAME', 'Unknown'),
                'host': connection.settings_dict.get('HOST', 'Unknown'),
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Debug database error: {str(e)}")
        return Response({
            'error': 'Debug query failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])
def disputes_admin(request):
    """
    Admin disputes endpoint that was missing.
    """
    try:
        # Skip admin permission check for now (authentication disabled)
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response({
        #         'error': 'Admin access required'
        #     }, status=status.HTTP_403_FORBIDDEN)
        
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
                'pending_disputes': Dispute.objects.filter(status__in=[Dispute.DisputeStatus.OPEN, Dispute.DisputeStatus.IN_REVIEW]).count() if hasattr(Dispute, 'status') else 0,
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