"""
Admin views for refund management
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
import logging

from .models import RefundRequest, Refund
from .services import PaymentService
from .serializers import RefundRequestSerializer, RefundRequestDetailSerializer

logger = logging.getLogger(__name__)


class RefundRequestViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing refund requests
    """
    serializer_class = RefundRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Only admins and staff can view refund requests
        """
        if not (self.request.user.is_staff or self.request.user.is_superuser or self.request.user.email == 'darelldrayton93@gmail.com'):
            return RefundRequest.objects.none()
        
        return RefundRequest.objects.select_related(
            'booking', 
            'payment', 
            'requested_by',
            'reviewed_by',
            'refund'
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        """
        Use detailed serializer for retrieve action
        """
        if self.action == 'retrieve':
            return RefundRequestDetailSerializer
        return RefundRequestSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a refund request and process the refund
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can approve refunds'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        refund_request = self.get_object()
        
        if not refund_request.can_be_approved:
            return Response(
                {'error': 'This refund request cannot be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Get approval details from request
                approved_amount = request.data.get('approved_amount')
                admin_notes = request.data.get('admin_notes', '')
                
                # Validate approved amount
                if approved_amount is not None:
                    try:
                        approved_amount = float(approved_amount)
                        if approved_amount <= 0 or approved_amount > float(refund_request.requested_amount):
                            return Response(
                                {'error': 'Invalid approved amount'}, 
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    except (ValueError, TypeError):
                        return Response(
                            {'error': 'Invalid approved amount format'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    approved_amount = float(refund_request.requested_amount)
                
                # Update refund request
                refund_request.status = RefundRequest.RequestStatus.APPROVED
                refund_request.approved_amount = approved_amount
                refund_request.admin_notes = admin_notes
                refund_request.reviewed_by = request.user
                refund_request.reviewed_at = timezone.now()
                refund_request.save()
                
                # Process the refund through Stripe
                refund_record = PaymentService.process_refund(
                    booking_id=refund_request.booking.id,
                    refund_reason=refund_request.reason,
                    refund_amount=approved_amount
                )
                
                # Link the refund to the request
                refund_request.refund = refund_record
                refund_request.status = RefundRequest.RequestStatus.PROCESSED
                refund_request.processed_at = timezone.now()
                refund_request.save()
                
                logger.info(f"Refund request {refund_request.request_id} approved and processed by {request.user.email}")
                
                # Return updated request
                serializer = RefundRequestDetailSerializer(refund_request)
                return Response({
                    'message': 'Refund approved and processed successfully',
                    'refund_request': serializer.data
                })
                
        except Exception as e:
            logger.error(f"Error processing refund approval: {str(e)}")
            return Response(
                {'error': f'Failed to process refund: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a refund request
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can reject refunds'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        refund_request = self.get_object()
        
        if not refund_request.can_be_approved:
            return Response(
                {'error': 'This refund request cannot be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get rejection details
            rejection_reason = request.data.get('rejection_reason', '')
            admin_notes = request.data.get('admin_notes', '')
            
            if not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update refund request
            refund_request.status = RefundRequest.RequestStatus.REJECTED
            refund_request.rejection_reason = rejection_reason
            refund_request.admin_notes = admin_notes
            refund_request.reviewed_by = request.user
            refund_request.reviewed_at = timezone.now()
            refund_request.save()
            
            logger.info(f"Refund request {refund_request.request_id} rejected by {request.user.email}")
            
            # Return updated request
            serializer = RefundRequestDetailSerializer(refund_request)
            return Response({
                'message': 'Refund request rejected',
                'refund_request': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error rejecting refund request: {str(e)}")
            return Response(
                {'error': f'Failed to reject refund: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending refund requests
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can view pending refunds'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_requests = self.get_queryset().filter(
            status=RefundRequest.RequestStatus.PENDING
        )
        
        serializer = self.get_serializer(pending_requests, many=True)
        return Response({
            'count': pending_requests.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get refund request statistics
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can view refund stats'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all refund requests (not filtered by get_queryset for accurate counts)
        all_refunds = RefundRequest.objects.all()
        
        # Calculate time-based stats
        one_week_ago = timezone.now() - timezone.timedelta(days=7)
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        
        stats = {
            'total_requests': all_refunds.count(),
            'pending_requests': all_refunds.filter(status=RefundRequest.RequestStatus.PENDING).count(),
            'approved_requests': all_refunds.filter(status=RefundRequest.RequestStatus.APPROVED).count(),
            'rejected_requests': all_refunds.filter(status=RefundRequest.RequestStatus.REJECTED).count(),
            'processed_requests': all_refunds.filter(status=RefundRequest.RequestStatus.PROCESSED).count(),
            'recent_requests': all_refunds.filter(
                created_at__gte=one_week_ago
            ).count(),
            'monthly_requests': all_refunds.filter(
                created_at__gte=one_month_ago
            ).count(),
            'total_requested_amount': sum(
                float(req.requested_amount or 0) 
                for req in all_refunds
            ),
            'total_approved_amount': sum(
                float(req.approved_amount or 0) 
                for req in all_refunds.filter(status__in=[
                    RefundRequest.RequestStatus.APPROVED,
                    RefundRequest.RequestStatus.PROCESSED
                ])
            ),
            'total_pending_amount': sum(
                float(req.requested_amount or 0) 
                for req in all_refunds.filter(status=RefundRequest.RequestStatus.PENDING)
            ),
        }
        
        return Response(stats)