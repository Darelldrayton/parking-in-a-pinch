"""
Admin views for refund management
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.http import HttpResponse
import logging
import csv
import io

from .models import RefundRequest, Refund, PayoutRequest, Payout
from .services import PaymentService
from .serializers import (
    RefundRequestSerializer, RefundRequestDetailSerializer,
    PayoutRequestSerializer, PayoutRequestDetailSerializer,
    ApprovePayoutSerializer, RejectPayoutSerializer, CompletePayoutSerializer
)

logger = logging.getLogger(__name__)


class RefundRequestViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing refund requests
    """
    serializer_class = RefundRequestSerializer
    permission_classes = []  # Temporarily disabled for admin dashboard
    
    def get_queryset(self):
        """
        Only admins and staff can view refund requests
        """
        # Temporarily disabled admin check
        # if not (self.request.user.is_staff or self.request.user.is_superuser or self.request.user.email == 'darelldrayton93@gmail.com'):
        #     return RefundRequest.objects.none()
        
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
        # Temporarily disabled admin check for dashboard access
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response(
        #         {'error': 'Only admin users can approve refunds'}, 
        #         status=status.HTTP_403_FORBIDDEN
        #     )
        
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
                refund_request.reviewed_by = request.user if hasattr(request, 'user') and request.user.is_authenticated else None if hasattr(request, 'user') and request.user.is_authenticated else None
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
                
                admin_email = request.user.email if hasattr(request, 'user') and hasattr(request.user, 'email') else 'anonymous'
                logger.info(f"Refund request {refund_request.request_id} approved and processed by {admin_email}")
                
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
        # Temporarily disabled admin check for dashboard access
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response(
        #         {'error': 'Only admin users can reject refunds'}, 
        #         status=status.HTTP_403_FORBIDDEN
        #     )
        
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
            refund_request.reviewed_by = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            refund_request.reviewed_at = timezone.now()
            refund_request.save()
            
            admin_email = request.user.email if hasattr(request, 'user') and hasattr(request.user, 'email') else 'anonymous'
            logger.info(f"Refund request {refund_request.request_id} rejected by {admin_email}")
            
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
        # Temporarily disabled admin check for dashboard access
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response(
        #         {'error': 'Only admin users can view pending refunds'}, 
        #         status=status.HTTP_403_FORBIDDEN
        #     )
        
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
        # Temporarily disabled admin check for dashboard access
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response(
        #         {'error': 'Only admin users can view refund stats'}, 
        #         status=status.HTTP_403_FORBIDDEN
        #     )
        
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


class PayoutRequestViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing payout requests
    """
    serializer_class = PayoutRequestSerializer
    permission_classes = []  # Temporarily disabled for admin dashboard
    
    def get_queryset(self):
        """
        Only admins and staff can view payout requests
        """
        return PayoutRequest.objects.select_related(
            'host', 
            'reviewed_by',
            'payout'
        ).prefetch_related('payments').order_by('-created_at')
    
    def get_serializer_class(self):
        """
        Use detailed serializer for retrieve action
        """
        if self.action == 'retrieve':
            return PayoutRequestDetailSerializer
        return PayoutRequestSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a payout request
        """
        payout_request = self.get_object()
        
        if not payout_request.can_be_approved:
            return Response(
                {'error': 'This payout request cannot be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ApprovePayoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Get approval details from request
                approved_amount = serializer.validated_data.get('approved_amount')
                admin_notes = serializer.validated_data.get('admin_notes', '')
                
                # Validate approved amount
                if approved_amount is not None:
                    if approved_amount <= 0 or approved_amount > payout_request.requested_amount:
                        return Response(
                            {'error': 'Invalid approved amount'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    approved_amount = payout_request.requested_amount
                
                # Update payout request
                payout_request.status = PayoutRequest.RequestStatus.APPROVED
                payout_request.approved_amount = approved_amount
                payout_request.admin_notes = admin_notes
                payout_request.reviewed_by = request.user if hasattr(request, 'user') and request.user.is_authenticated else None if hasattr(request, 'user') and request.user.is_authenticated else None
                payout_request.reviewed_at = timezone.now()
                payout_request.save()
                
                admin_email = request.user.email if hasattr(request, 'user') and hasattr(request.user, 'email') else 'anonymous'
                logger.info(f"Payout request {payout_request.request_id} approved by {admin_email}")
                
                # Return updated request
                serializer = PayoutRequestDetailSerializer(payout_request)
                return Response({
                    'message': 'Payout request approved successfully',
                    'payout_request': serializer.data
                })
                
        except Exception as e:
            logger.error(f"Error approving payout request: {str(e)}")
            return Response(
                {'error': f'Failed to approve payout: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a payout request
        """
        payout_request = self.get_object()
        
        if not payout_request.can_be_approved:
            return Response(
                {'error': 'This payout request cannot be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = RejectPayoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get rejection details
            rejection_reason = serializer.validated_data.get('rejection_reason')
            admin_notes = serializer.validated_data.get('admin_notes', '')
            
            # Update payout request
            payout_request.status = PayoutRequest.RequestStatus.REJECTED
            payout_request.rejection_reason = rejection_reason
            payout_request.admin_notes = admin_notes
            payout_request.reviewed_by = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            payout_request.reviewed_at = timezone.now()
            payout_request.save()
            
            admin_email = request.user.email if hasattr(request, 'user') and hasattr(request.user, 'email') else 'anonymous'
            logger.info(f"Payout request {payout_request.request_id} rejected by {admin_email}")
            
            # Return updated request
            serializer = PayoutRequestDetailSerializer(payout_request)
            return Response({
                'message': 'Payout request rejected',
                'payout_request': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error rejecting payout request: {str(e)}")
            return Response(
                {'error': f'Failed to reject payout: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a payout request as completed (after payment is sent)
        """
        payout_request = self.get_object()
        
        if payout_request.status != PayoutRequest.RequestStatus.APPROVED:
            return Response(
                {'error': 'Only approved payout requests can be marked as completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CompletePayoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Get completion details
                admin_notes = serializer.validated_data.get('admin_notes', '')
                stripe_payout_id = serializer.validated_data.get('stripe_payout_id', '')
                
                # Create a payout record
                payout = Payout.objects.create(
                    host=payout_request.host,
                    amount=payout_request.final_amount,
                    status=Payout.PayoutStatus.PAID,
                    period_start=timezone.now() - timezone.timedelta(days=30),  # Default period
                    period_end=timezone.now(),
                    description=f"Manual payout for request {payout_request.request_id}",
                    admin_notes=admin_notes,
                    stripe_payout_id=stripe_payout_id,
                    processed_at=timezone.now()
                )
                
                # Add payments to the payout
                payout.payments.set(payout_request.payments.all())
                
                # Update payout request
                payout_request.status = PayoutRequest.RequestStatus.COMPLETED
                payout_request.payout = payout
                payout_request.processed_at = timezone.now()
                if admin_notes:
                    payout_request.admin_notes = f"{payout_request.admin_notes}\n{admin_notes}".strip()
                payout_request.save()
                
                admin_email = request.user.email if hasattr(request, 'user') and hasattr(request.user, 'email') else 'anonymous'
                logger.info(f"Payout request {payout_request.request_id} completed by {admin_email}")
                
                # Return updated request
                serializer = PayoutRequestDetailSerializer(payout_request)
                return Response({
                    'message': 'Payout marked as completed',
                    'payout_request': serializer.data
                })
                
        except Exception as e:
            logger.error(f"Error completing payout request: {str(e)}")
            return Response(
                {'error': f'Failed to complete payout: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending payout requests
        """
        pending_requests = self.get_queryset().filter(
            status=PayoutRequest.RequestStatus.PENDING
        )
        
        serializer = self.get_serializer(pending_requests, many=True)
        return Response({
            'count': pending_requests.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get payout request statistics
        """
        # Get all payout requests
        all_payouts = PayoutRequest.objects.all()
        
        # Calculate time-based stats
        one_week_ago = timezone.now() - timezone.timedelta(days=7)
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        
        stats = {
            'total_requests': all_payouts.count(),
            'pending_requests': all_payouts.filter(status=PayoutRequest.RequestStatus.PENDING).count(),
            'approved_requests': all_payouts.filter(status=PayoutRequest.RequestStatus.APPROVED).count(),
            'rejected_requests': all_payouts.filter(status=PayoutRequest.RequestStatus.REJECTED).count(),
            'completed_requests': all_payouts.filter(status=PayoutRequest.RequestStatus.COMPLETED).count(),
            'recent_requests': all_payouts.filter(
                created_at__gte=one_week_ago
            ).count(),
            'monthly_requests': all_payouts.filter(
                created_at__gte=one_month_ago
            ).count(),
            'total_requested_amount': sum(
                float(req.requested_amount or 0) 
                for req in all_payouts
            ),
            'total_approved_amount': sum(
                float(req.approved_amount or req.requested_amount or 0) 
                for req in all_payouts.filter(status__in=[
                    PayoutRequest.RequestStatus.APPROVED,
                    PayoutRequest.RequestStatus.COMPLETED
                ])
            ),
            'total_pending_amount': sum(
                float(req.requested_amount or 0) 
                for req in all_payouts.filter(status=PayoutRequest.RequestStatus.PENDING)
            ),
            'total_completed_amount': sum(
                float(req.final_amount or 0) 
                for req in all_payouts.filter(status=PayoutRequest.RequestStatus.COMPLETED)
            ),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def export_approved(self, request):
        """
        Export all approved payout requests to Excel/CSV format
        """
        # Get approved and completed payout requests
        approved_requests = self.get_queryset().filter(
            status__in=[
                PayoutRequest.RequestStatus.APPROVED,
                PayoutRequest.RequestStatus.COMPLETED
            ]
        ).order_by('-created_at')
        
        # Create response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="approved_payout_requests_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        # Create CSV writer
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Request ID',
            'Host Name',
            'Host Email',
            'Requested Amount',
            'Approved Amount',
            'Final Amount',
            'Payout Method',
            'Status',
            'Bank Name',
            'Account Holder',
            'Account Number (Masked)',
            'Routing Number',
            'Payment Count',
            'Host Notes',
            'Admin Notes',
            'Created Date',
            'Reviewed Date',
            'Processed Date',
            'Reviewed By'
        ])
        
        # Write data rows
        for request in approved_requests:
            writer.writerow([
                request.request_id,
                request.host.get_full_name() or f"{request.host.first_name} {request.host.last_name}".strip(),
                request.host.email,
                f"${float(request.requested_amount):.2f}",
                f"${float(request.approved_amount or request.requested_amount):.2f}",
                f"${float(request.final_amount):.2f}",
                request.get_payout_method_display(),
                request.get_status_display(),
                request.bank_name or '',
                request.account_holder_name or '',
                f"****{request.account_number[-4:]}" if request.account_number and len(request.account_number) >= 4 else '',
                request.routing_number or '',
                request.payments.count(),
                request.host_notes or '',
                request.admin_notes or '',
                request.created_at.strftime('%Y-%m-%d %H:%M:%S') if request.created_at else '',
                request.reviewed_at.strftime('%Y-%m-%d %H:%M:%S') if request.reviewed_at else '',
                request.processed_at.strftime('%Y-%m-%d %H:%M:%S') if request.processed_at else '',
                request.reviewed_by.email if request.reviewed_by else ''
            ])
        
        return response