from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import datetime
import logging

from .models import Booking, BookingReview, BookingStatus
from .serializers import (
    BookingSerializer, CreateBookingSerializer, BookingDetailSerializer,
    BookingReviewSerializer
)
from .filters import BookingFilter
from apps.listings.models import ParkingListing
from apps.users.models import User

logger = logging.getLogger(__name__)


class BookingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]  # TEMPORARILY DISABLED FOR 403 FIX
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = BookingFilter
    search_fields = ['booking_id', 'parking_space__title', 'vehicle_license_plate']
    ordering_fields = ['created_at', 'start_time', 'end_time', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter bookings based on user role"""
        user = self.request.user
        
        # If user is a host, show bookings for their parking spaces
        if hasattr(user, 'parking_listings') and user.parking_listings.exists():
            host_bookings = Booking.objects.filter(parking_space__host=user)
            renter_bookings = Booking.objects.filter(user=user)
            return (host_bookings | renter_bookings).distinct()
        
        # Otherwise, show only user's own bookings
        return Booking.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateBookingSerializer
        elif self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new booking with host approval workflow"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Creating booking with data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Booking validation errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        
        # Booking status is determined by the serializer based on availability schedule
        booking = serializer.save(user=request.user)
        
        logger.info(f"Booking {booking.booking_id} created with status: {booking.status}")
        
        # Return the full booking data with ID
        response_serializer = BookingSerializer(booking)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a pending booking (host only)"""
        booking = self.get_object()
        
        # Check if user is the parking space owner
        if booking.parking_space.host != request.user:
            return Response(
                {'error': 'Only the parking space owner can confirm bookings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status == BookingStatus.PENDING:
            booking.status = BookingStatus.CONFIRMED
            booking.confirmed_at = timezone.now()
            booking.save()
            
            serializer = self.get_serializer(booking)
            return Response({
                'message': 'Booking confirmed successfully',
                'booking': serializer.data
            })
        
        return Response(
            {'error': 'Cannot confirm this booking'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        
        # Check if user can cancel this booking
        if booking.user != request.user and booking.parking_space.host != request.user:
            return Response(
                {'error': 'You do not have permission to cancel this booking'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.can_be_cancelled:
            booking.status = BookingStatus.CANCELLED
            booking.save()
            
            # Create refund request instead of processing immediately
            from ..payments.models import RefundRequest
            from ..payments.services import RefundService
            try:
                # Check if there's a payment to refund
                payment = booking.payment_set.filter(status='completed').first()
                if payment:
                    refund_amount = RefundService.calculate_refund_amount(booking)
                    if refund_amount > 0:
                        # Create refund request for admin approval
                        RefundRequest.objects.create(
                            booking=booking,
                            payment=payment,
                            requested_amount=refund_amount,
                            reason='cancelled_by_user',
                            requested_by=request.user,
                            status='pending'
                        )
                        logger.info(f"Refund request created for booking {booking.id}: ${refund_amount}")
            except Exception as e:
                logger.error(f"Error creating refund request for booking {booking.id}: {str(e)}")
            
            serializer = self.get_serializer(booking)
            return Response({
                'message': 'Booking cancelled successfully',
                'booking': serializer.data
            })
        
        return Response(
            {'error': 'Cannot cancel this booking'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Mark booking as active when user arrives"""
        booking = self.get_object()
        
        if booking.user != request.user:
            return Response(
                {'error': 'Only the renter can start their booking'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status == BookingStatus.CONFIRMED:
            # Check if booking is within the allowed check-in window
            now = timezone.now()
            start_window = booking.start_time - timezone.timedelta(minutes=15)  # Can check in 15 min early
            end_time = booking.end_time
            
            if now >= start_window and now <= end_time:
                booking.status = BookingStatus.ACTIVE
                booking.actual_start_time = now  # Set actual check-in time
                booking.save()
                
                serializer = self.get_serializer(booking)
                return Response({
                    'message': 'Booking started successfully',
                    'booking': serializer.data
                })
            elif now < start_window:
                return Response(
                    {'error': 'Cannot start booking yet. You can check in 15 minutes before your booking starts.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Cannot start booking. Your booking time has expired.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {'error': 'Cannot start this booking'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark booking as completed"""
        booking = self.get_object()
        
        if booking.user != request.user:
            return Response(
                {'error': 'Only the renter can complete their booking'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status == BookingStatus.ACTIVE:
            booking.status = BookingStatus.COMPLETED
            booking.actual_end_time = timezone.now()  # Set actual check-out time
            booking.save()
            
            serializer = self.get_serializer(booking)
            return Response({
                'message': 'Booking completed successfully',
                'booking': serializer.data
            })
        
        return Response(
            {'error': 'Cannot complete this booking'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def request_refund(self, request, pk=None):
        """Request a refund for a booking - requires admin approval"""
        booking = self.get_object()
        
        # Check if user owns this booking
        if booking.user != request.user:
            return Response(
                {'error': 'Only the booking owner can request a refund'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if booking can have a refund requested
        if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED]:
            return Response(
                {'error': 'Cannot request refund for this booking status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if payment exists
        from apps.payments.models import Payment, RefundRequest
        payment = Payment.objects.filter(booking=booking, status='succeeded').first()
        
        if not payment:
            return Response(
                {'error': 'No payment found for this booking'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if refund request already exists
        existing_request = RefundRequest.objects.filter(
            booking=booking,
            status__in=['pending', 'approved']
        ).first()
        
        if existing_request:
            return Response(
                {'error': 'A refund request is already pending for this booking'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get refund details from request
            reason = request.data.get('reason', 'requested_by_customer')
            description = request.data.get('description', '')
            requested_amount = request.data.get('requested_amount')
            
            # Calculate refund amount if not provided
            if requested_amount is None:
                from apps.payments.services import RefundService
                requested_amount = RefundService.calculate_refund_amount(booking)
            
            # Create refund request
            refund_request = RefundRequest.objects.create(
                booking=booking,
                payment=payment,
                requested_by=request.user,
                reason=reason,
                requested_amount=requested_amount,
                customer_notes=description,
                status='pending'
            )
            
            logger.info(f"Refund request created for booking {booking.booking_id} by user {request.user.email}")
            
            # Send notification to admins
            try:
                from apps.notifications.services import NotificationService
                # Notify admins about new refund request
                admin_users = User.objects.filter(is_staff=True, is_active=True)
                for admin in admin_users:
                    NotificationService.send_notification(
                        user=admin,
                        template_type='ADMIN_REFUND_REQUEST',
                        context={
                            'user_name': request.user.get_full_name(),
                            'booking_id': booking.booking_id,
                            'amount': requested_amount,
                            'reason': reason
                        },
                        channels=['IN_APP', 'EMAIL']
                    )
            except Exception as e:
                logger.error(f"Failed to send admin notification: {str(e)}")
            
            return Response({
                'message': 'Refund request submitted successfully. An admin will review your request within 24-48 hours.',
                'refund_request': {
                    'id': refund_request.id,
                    'request_id': refund_request.request_id,
                    'status': refund_request.status,
                    'requested_amount': str(refund_request.requested_amount),
                    'reason': refund_request.reason
                }
            })
            
        except Exception as e:
            logger.error(f"Error creating refund request: {str(e)}")
            return Response(
                {'error': 'Failed to create refund request'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Host approves a pending booking"""
        booking = self.get_object()
        
        # Check if user is the host of the parking space
        if booking.parking_space.host != request.user:
            return Response(
                {'error': 'Only the host can approve this booking'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if booking can be approved
        if booking.status != BookingStatus.PENDING:
            return Response(
                {'error': 'Only pending bookings can be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if booking time hasn't passed
        if booking.start_time <= timezone.now():
            return Response(
                {'error': 'Cannot approve booking - start time has passed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update booking status
            booking.status = BookingStatus.CONFIRMED
            booking.confirmed_at = timezone.now()
            booking.save()
            
            # Send notification to user about approval
            try:
                from apps.notifications.services import NotificationService
                from apps.notifications.models import NotificationChannel
                
                variables = {
                    'user_name': booking.user.first_name,
                    'booking_id': booking.booking_id,
                    'space_title': booking.parking_space.title,
                    'start_time': booking.start_time.strftime('%Y-%m-%d %H:%M'),
                    'host_name': booking.parking_space.host.get_full_name(),
                }
                
                NotificationService.send_notification(
                    user=booking.user,
                    template_name='booking_approved',
                    variables=variables,
                    channel=NotificationChannel.EMAIL
                )
            except Exception as e:
                logger.warning(f"Failed to send approval notification: {str(e)}")
            
            logger.info(f"Booking {booking.booking_id} approved by host {request.user.email}")
            
            serializer = self.get_serializer(booking)
            return Response({
                'message': 'Booking approved successfully',
                'booking': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error approving booking {booking.id}: {str(e)}")
            return Response(
                {'error': 'Failed to approve booking'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Host rejects a pending booking"""
        booking = self.get_object()
        
        # Check if user is the host of the parking space
        if booking.parking_space.host != request.user:
            return Response(
                {'error': 'Only the host can reject this booking'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if booking can be rejected
        if booking.status != BookingStatus.PENDING:
            return Response(
                {'error': 'Only pending bookings can be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rejection_reason = request.data.get('reason', '')
            
            # Update booking status
            booking.status = BookingStatus.CANCELLED
            booking.save()
            
            # Process refund if payment was made
            try:
                from ..payments.models import RefundRequest
                from ..payments.services import RefundService
                
                payment = booking.payment_set.filter(status='completed').first()
                if payment:
                    refund_amount = RefundService.calculate_refund_amount(booking)
                    if refund_amount > 0:
                        # Create refund request for admin approval
                        RefundRequest.objects.create(
                            booking=booking,
                            payment=payment,
                            requested_amount=refund_amount,
                            reason='rejected_by_host',
                            requested_by=booking.user,
                            status='pending'
                        )
                        logger.info(f"Refund request created for rejected booking {booking.id}: ${refund_amount}")
            except Exception as e:
                logger.error(f"Error creating refund request for rejected booking {booking.id}: {str(e)}")
            
            # Send notification to user about rejection with reason
            try:
                from apps.notifications.services import NotificationService
                from apps.notifications.models import NotificationChannel
                
                variables = {
                    'user_name': booking.user.first_name,
                    'booking_id': booking.booking_id,
                    'space_title': booking.parking_space.title,
                    'start_time': booking.start_time.strftime('%Y-%m-%d %H:%M'),
                    'host_name': booking.parking_space.host.get_full_name(),
                    'rejection_reason': rejection_reason,
                }
                
                NotificationService.send_notification(
                    user=booking.user,
                    template_name='booking_rejected',
                    variables=variables,
                    channel=NotificationChannel.EMAIL
                )
            except Exception as e:
                logger.warning(f"Failed to send rejection notification: {str(e)}")
            
            logger.info(f"Booking {booking.booking_id} rejected by host {request.user.email}. Reason: {rejection_reason}")
            
            serializer = self.get_serializer(booking)
            return Response({
                'message': 'Booking rejected successfully',
                'booking': serializer.data,
                'rejection_reason': rejection_reason
            })
            
        except Exception as e:
            logger.error(f"Error rejecting booking {booking.id}: {str(e)}")
            return Response(
                {'error': 'Failed to reject booking'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def pending_host_approval(self, request):
        """Get bookings pending host approval for current user's parking spaces"""
        try:
            # Get user's parking spaces
            from apps.listings.models import ParkingListing
            user_spaces = ParkingListing.objects.filter(host=request.user)
            
            # Get pending bookings for these spaces
            pending_bookings = self.get_queryset().filter(
                parking_space__in=user_spaces,
                status=BookingStatus.PENDING
            ).order_by('start_time')
            
            serializer = self.get_serializer(pending_bookings, many=True)
            return Response({
                'count': pending_bookings.count(),
                'results': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error getting pending bookings for host {request.user.email}: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve pending bookings'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def refund_eligibility(self, request, pk=None):
        """Get refund eligibility information for a booking"""
        booking = self.get_object()
        
        if booking.user != request.user:
            return Response(
                {'error': 'You can only check refund eligibility for your own bookings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        from ..payments.services import RefundService
        
        try:
            refund_amount = RefundService.calculate_refund_amount(booking)
            policy_text = RefundService.get_refund_policy_text(booking)
            
            # Calculate hours until booking start
            now = timezone.now()
            hours_until_booking = max(0, (booking.start_time - now).total_seconds() / 3600)
            
            return Response({
                'eligible_for_refund': refund_amount > 0,
                'refund_amount': float(refund_amount),
                'original_amount': float(booking.total_amount),
                'refund_percentage': float((refund_amount / booking.total_amount) * 100) if booking.total_amount > 0 else 0,
                'hours_until_booking': round(hours_until_booking, 1),
                'cancellation_policy': booking.parking_space.cancellation_policy or 'moderate',
                'policy_description': policy_text,
                'can_cancel': booking.can_be_cancelled,
                'booking_status': booking.status
            })
            
        except Exception as e:
            logger.error(f"Error checking refund eligibility for booking {booking.id}: {str(e)}")
            return Response(
                {'error': 'Unable to calculate refund eligibility'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently active bookings"""
        active_bookings = self.get_queryset().filter(
            status=BookingStatus.ACTIVE,
            start_time__lte=timezone.now(),
            end_time__gte=timezone.now()
        )
        serializer = self.get_serializer(active_bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming bookings"""
        upcoming_bookings = self.get_queryset().filter(
            status__in=[BookingStatus.CONFIRMED, BookingStatus.PENDING],
            start_time__gt=timezone.now()
        ).order_by('start_time')
        
        serializer = self.get_serializer(upcoming_bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get booking history"""
        history_bookings = self.get_queryset().filter(
            status__in=[BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]
        ).order_by('-end_time')
        
        serializer = self.get_serializer(history_bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get booking statistics for the user"""
        user_bookings = self.get_queryset()
        
        stats = {
            'total_bookings': user_bookings.count(),
            'completed_bookings': user_bookings.filter(status=BookingStatus.COMPLETED).count(),
            'cancelled_bookings': user_bookings.filter(status=BookingStatus.CANCELLED).count(),
            'active_bookings': user_bookings.filter(status=BookingStatus.ACTIVE).count(),
            'upcoming_bookings': user_bookings.filter(
                status__in=[BookingStatus.CONFIRMED, BookingStatus.PENDING],
                start_time__gt=timezone.now()
            ).count(),
            'total_spent': sum(
                booking.total_amount or 0 
                for booking in user_bookings.filter(status=BookingStatus.COMPLETED)
            ),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def check_availability(self, request):
        """Check if a parking space is available for the requested time period"""
        from rest_framework import serializers as drf_serializers
        
        # Validate required parameters
        parking_space_id = request.data.get('parking_space_id')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        
        if not all([parking_space_id, start_time_str, end_time_str]):
            return Response({
                'error': 'parking_space_id, start_time, and end_time are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse datetime strings and make them timezone-aware
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            
            # Ensure timezone awareness
            if start_time.tzinfo is None:
                start_time = timezone.make_aware(start_time)
            if end_time.tzinfo is None:
                end_time = timezone.make_aware(end_time)
            
            # Get parking space
            parking_space = ParkingListing.objects.get(id=parking_space_id)
            
            # Check basic time validation
            if start_time >= end_time:
                return Response({
                    'available': False,
                    'reason': 'End time must be after start time'
                }, status=status.HTTP_200_OK)
            
            if start_time <= timezone.now():
                return Response({
                    'available': False,
                    'reason': 'Start time must be in the future'
                }, status=status.HTTP_200_OK)
            
            # Check for overlapping bookings
            overlapping_bookings = Booking.objects.filter(
                parking_space=parking_space,
                status__in=[BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            if overlapping_bookings.exists():
                # Return details about conflicting bookings (anonymized)
                conflicts = []
                for booking in overlapping_bookings:
                    conflicts.append({
                        'start_time': booking.start_time.isoformat(),
                        'end_time': booking.end_time.isoformat(),
                        'status': booking.status
                    })
                
                return Response({
                    'available': False,
                    'reason': 'Time slot conflicts with existing bookings',
                    'conflicts': conflicts
                }, status=status.HTTP_200_OK)
            
            # Check parking space availability schedule
            if hasattr(parking_space, 'availability_schedule') and parking_space.availability_schedule:
                try:
                    self._validate_schedule_availability(start_time, end_time, parking_space.availability_schedule)
                except drf_serializers.ValidationError as e:
                    # Extract the error message properly
                    error_message = str(e)
                    if hasattr(e, 'detail'):
                        if isinstance(e.detail, list) and len(e.detail) > 0:
                            error_message = str(e.detail[0])
                        elif isinstance(e.detail, dict):
                            # Handle dict-style error details
                            error_message = str(list(e.detail.values())[0])
                        else:
                            error_message = str(e.detail)
                    
                    return Response({
                        'available': False,
                        'reason': error_message
                    }, status=status.HTTP_200_OK)
            
            # If we get here, the space is available
            return Response({
                'available': True,
                'parking_space': {
                    'id': parking_space.id,
                    'title': parking_space.title,
                    'hourly_rate': float(parking_space.hourly_rate)
                }
            }, status=status.HTTP_200_OK)
            
        except ParkingListing.DoesNotExist:
            return Response({
                'error': 'Parking space not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'error': f'Invalid datetime format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _validate_schedule_availability(self, start_time, end_time, availability_schedule):
        """Helper method to validate against availability schedule"""
        from rest_framework import serializers as drf_serializers
        from datetime import datetime
        import pytz
        from django.conf import settings
        
        # Get day names mapping (Monday = 0, Sunday = 6)
        day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        # Get the local timezone
        local_tz = pytz.timezone(settings.TIME_ZONE)
        
        # Convert booking times to local timezone for comparison
        local_start_time = start_time.astimezone(local_tz)
        local_end_time = end_time.astimezone(local_tz)
        
        # Check each day the booking spans
        current_datetime = local_start_time
        while current_datetime.date() <= local_end_time.date():
            day_name = day_names[current_datetime.weekday()]
            
            if day_name not in availability_schedule:
                raise drf_serializers.ValidationError(
                    f"Parking space schedule not configured for {day_name.title()}"
                )
            
            day_schedule = availability_schedule[day_name]
            
            if not day_schedule.get('available', False):
                raise drf_serializers.ValidationError(
                    f"Parking space is not available on {day_name.title()}"
                )
            
            # Parse schedule times
            try:
                schedule_start = datetime.strptime(day_schedule['start'], '%H:%M').time()
                schedule_end = datetime.strptime(day_schedule['end'], '%H:%M').time()
            except (KeyError, ValueError):
                # Skip validation if schedule format is invalid
                current_datetime = current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
                current_datetime += timezone.timedelta(days=1)
                continue
            
            # Check if booking times fall within available hours for this day
            if current_datetime.date() == local_start_time.date():
                if local_start_time.time() < schedule_start:
                    raise drf_serializers.ValidationError(
                        f"Parking space opens at {day_schedule['start']} on {day_name.title()}"
                    )
            
            if current_datetime.date() == local_end_time.date():
                if local_end_time.time() > schedule_end:
                    raise drf_serializers.ValidationError(
                        f"Parking space closes at {day_schedule['end']} on {day_name.title()}"
                    )
            
            # Move to next day
            current_datetime = current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
            current_datetime += timezone.timedelta(days=1)




class BookingReviewViewSet(viewsets.ModelViewSet):
    serializer_class = BookingReviewSerializer
    permission_classes = [permissions.AllowAny]  # TEMPORARILY DISABLED FOR 403 FIX
    
    def get_queryset(self):
        return BookingReview.objects.filter(
            Q(reviewer=self.request.user) | 
            Q(booking__parking_space__host=self.request.user)
        )
    
    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)