"""
QR Code API Views
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from .models import QRCode, QRCodeTemplate, QRCodeBatch, QRCodeType
from .services import QRCodeGenerator, QRCodeVerifier, QRCodeBatchProcessor, QRCodeAnalytics
from .serializers import (
    QRCodeSerializer, QRCodeCreateSerializer, QRCodeVerifySerializer,
    QRCodeTemplateSerializer, QRCodeBatchSerializer, QRCodeUsageSerializer
)
from ..bookings.models import Booking
from ..listings.models import ParkingListing

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_qr_code(request):
    """Generate a new QR code"""
    try:
        serializer = QRCodeCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        qr_type = serializer.validated_data['qr_type']
        booking_id = serializer.validated_data.get('booking_id')
        listing_id = serializer.validated_data.get('listing_id')
        expiry_hours = serializer.validated_data.get('expiry_hours', 24)
        location_restricted = serializer.validated_data.get('location_restricted', False)
        template_name = serializer.validated_data.get('template_name')
        
        # Get associated records
        booking = None
        listing = None
        
        if booking_id:
            booking = get_object_or_404(Booking, id=booking_id, user=request.user)
            listing = booking.listing
        elif listing_id:
            listing = get_object_or_404(ParkingListing, id=listing_id)
            # Check if user has permission to generate QR for this listing
            if listing.host != request.user:
                return Response(
                    {'error': 'You do not have permission to generate QR codes for this listing'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Generate QR code
        result = QRCodeGenerator.create_qr_code(
            user=request.user,
            qr_type=qr_type,
            booking=booking,
            listing=listing,
            expiry_hours=expiry_hours,
            location_restricted=location_restricted,
            template_name=template_name
        )
        
        return Response({
            'qr_code_id': str(result['qr_code'].id),
            'token': result['qr_code'].token,
            'qr_image_data': result['qr_image_data'],
            'verification_url': result['verification_url'],
            'expires_at': result['expires_at'],
            'type': qr_type,
            'location_restricted': location_restricted
        })
        
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        return Response(
            {'error': 'Failed to generate QR code'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # QR codes can be scanned by anyone
def verify_qr_code(request):
    """Verify and use a QR code"""
    try:
        serializer = QRCodeVerifySerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = serializer.validated_data['token']
        user_location = serializer.validated_data.get('location')
        
        # Get client info
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Verify QR code
        result = QRCodeVerifier.verify_qr_code(
            token=token,
            user_location=user_location,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        response_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
        
        return Response(result, status=response_status)
        
    except Exception as e:
        logger.error(f"Error verifying QR code: {str(e)}")
        return Response(
            {'success': False, 'error': 'Verification failed due to system error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_qr_info(request, token):
    """Get QR code information without using it"""
    try:
        qr_code = get_object_or_404(QRCode, token=token)
        
        # Return basic info
        info = {
            'type': qr_code.qr_type,
            'is_valid': qr_code.is_valid(),
            'expires_at': qr_code.expires_at,
            'location_restricted': qr_code.location_restricted,
            'single_use': qr_code.single_use,
            'uses_remaining': qr_code.max_uses - qr_code.current_uses,
        }
        
        # Add booking/listing info if available
        if qr_code.booking:
            info['booking'] = {
                'id': qr_code.booking.id,
                'listing_title': qr_code.booking.listing.title,
                'start_time': qr_code.booking.start_time,
                'end_time': qr_code.booking.end_time
            }
        
        if qr_code.listing:
            info['listing'] = {
                'id': qr_code.listing.id,
                'title': qr_code.listing.title,
                'address': qr_code.listing.address
            }
        
        return Response(info)
        
    except Exception as e:
        logger.error(f"Error getting QR info: {str(e)}")
        return Response(
            {'error': 'Failed to get QR code information'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_qr_codes(request):
    """Get user's QR codes"""
    try:
        qr_type = request.GET.get('type')
        active_only = request.GET.get('active_only', 'false').lower() == 'true'
        limit = int(request.GET.get('limit', 20))
        
        # Filter QR codes
        qr_codes = QRCode.objects.filter(user=request.user)
        
        if qr_type:
            qr_codes = qr_codes.filter(qr_type=qr_type)
        
        if active_only:
            qr_codes = qr_codes.filter(status='active')
        
        qr_codes = qr_codes.order_by('-generated_at')[:limit]
        
        serializer = QRCodeSerializer(qr_codes, many=True)
        
        return Response({
            'qr_codes': serializer.data,
            'total_count': qr_codes.count()
        })
        
    except Exception as e:
        logger.error(f"Error getting user QR codes: {str(e)}")
        return Response(
            {'error': 'Failed to get QR codes'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_qr_code(request, qr_code_id):
    """Revoke a QR code"""
    try:
        qr_code = get_object_or_404(QRCode, id=qr_code_id, user=request.user)
        
        reason = request.data.get('reason', 'User requested revocation')
        
        qr_code.revoke(reason=reason)
        
        return Response({
            'success': True,
            'message': 'QR code revoked successfully'
        })
        
    except Exception as e:
        logger.error(f"Error revoking QR code: {str(e)}")
        return Response(
            {'error': 'Failed to revoke QR code'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qr_code_usage_log(request, qr_code_id):
    """Get QR code usage log"""
    try:
        qr_code = get_object_or_404(QRCode, id=qr_code_id, user=request.user)
        
        usage_logs = qr_code.usage_logs.all().order_by('-used_at')
        
        serializer = QRCodeUsageSerializer(usage_logs, many=True)
        
        return Response({
            'qr_code_id': str(qr_code.id),
            'usage_logs': serializer.data,
            'total_uses': qr_code.current_uses
        })
        
    except Exception as e:
        logger.error(f"Error getting QR usage log: {str(e)}")
        return Response(
            {'error': 'Failed to get usage log'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qr_templates(request):
    """Get available QR code templates"""
    try:
        templates = QRCodeTemplate.objects.filter(is_active=True)
        
        serializer = QRCodeTemplateSerializer(templates, many=True)
        
        return Response({
            'templates': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error getting QR templates: {str(e)}")
        return Response(
            {'error': 'Failed to get templates'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_qr_batch(request):
    """Create a batch of QR codes"""
    try:
        template_id = request.data.get('template_id')
        quantity = request.data.get('quantity', 10)
        name = request.data.get('name', f'Batch {timezone.now().strftime("%Y%m%d-%H%M")}')
        description = request.data.get('description', '')
        prefix = request.data.get('prefix', '')
        
        # Validate quantity
        if quantity > 1000:
            return Response(
                {'error': 'Maximum batch size is 1000 QR codes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get template
        template = get_object_or_404(QRCodeTemplate, id=template_id, is_active=True)
        
        # Create batch
        batch = QRCodeBatchProcessor.create_batch(
            created_by=request.user,
            template=template,
            quantity=quantity,
            name=name,
            description=description,
            prefix=prefix
        )
        
        serializer = QRCodeBatchSerializer(batch)
        
        return Response({
            'batch': serializer.data,
            'message': f'Batch creation started. Generating {quantity} QR codes.'
        })
        
    except Exception as e:
        logger.error(f"Error creating QR batch: {str(e)}")
        return Response(
            {'error': 'Failed to create QR batch'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_qr_batches(request):
    """Get user's QR code batches"""
    try:
        batches = QRCodeBatch.objects.filter(created_by=request.user).order_by('-created_at')
        
        serializer = QRCodeBatchSerializer(batches, many=True)
        
        return Response({
            'batches': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error getting QR batches: {str(e)}")
        return Response(
            {'error': 'Failed to get QR batches'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_qr_batch(request, batch_id):
    """Download QR codes from batch"""
    try:
        batch = get_object_or_404(QRCodeBatch, id=batch_id, created_by=request.user)
        
        if batch.status != 'completed':
            return Response(
                {'error': 'Batch is not ready for download'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In a real implementation, this would generate and return a ZIP file
        # For now, return the batch QR codes as JSON
        qr_codes = QRCode.objects.filter(
            user=request.user,
            data__batch_id=str(batch.id)
        )
        
        serializer = QRCodeSerializer(qr_codes, many=True)
        
        return Response({
            'batch_id': str(batch.id),
            'qr_codes': serializer.data,
            'download_format': 'json'  # In production: 'zip'
        })
        
    except Exception as e:
        logger.error(f"Error downloading QR batch: {str(e)}")
        return Response(
            {'error': 'Failed to download batch'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qr_analytics(request):
    """Get QR code analytics"""
    try:
        days = int(request.GET.get('days', 30))
        
        stats = QRCodeAnalytics.get_usage_stats(request.user, days)
        
        return Response({
            'period_days': days,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting QR analytics: {str(e)}")
        return Response(
            {'error': 'Failed to get analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_checkin_qr(request, booking_id):
    """Generate check-in QR code for specific booking"""
    try:
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Check if booking is in valid state
        if booking.status not in ['confirmed', 'pending']:
            return Response(
                {'error': 'Booking is not in a valid state for check-in QR generation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate QR code
        result = QRCodeGenerator.create_qr_code(
            user=request.user,
            qr_type=QRCodeType.CHECKIN,
            booking=booking,
            expiry_hours=24,
            location_restricted=True,
            template_name='checkin_template'
        )
        
        return Response({
            'qr_code_id': str(result['qr_code'].id),
            'qr_image_data': result['qr_image_data'],
            'verification_url': result['verification_url'],
            'expires_at': result['expires_at'],
            'booking_id': booking.id,
            'listing_title': booking.listing.title
        })
        
    except Exception as e:
        logger.error(f"Error generating check-in QR: {str(e)}")
        return Response(
            {'error': 'Failed to generate check-in QR code'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_checkout_qr(request, booking_id):
    """Generate check-out QR code for specific booking"""
    try:
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Check if booking is in valid state
        if booking.status != 'active':
            return Response(
                {'error': 'Booking must be active to generate check-out QR'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate QR code
        result = QRCodeGenerator.create_qr_code(
            user=request.user,
            qr_type=QRCodeType.CHECKOUT,
            booking=booking,
            expiry_hours=1,  # Shorter expiry for checkout
            location_restricted=True,
            template_name='checkout_template'
        )
        
        return Response({
            'qr_code_id': str(result['qr_code'].id),
            'qr_image_data': result['qr_image_data'],
            'verification_url': result['verification_url'],
            'expires_at': result['expires_at'],
            'booking_id': booking.id,
            'listing_title': booking.listing.title
        })
        
    except Exception as e:
        logger.error(f"Error generating check-out QR: {str(e)}")
        return Response(
            {'error': 'Failed to generate check-out QR code'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )