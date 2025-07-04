"""
Admin views for user management and identity verification
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
import logging

from .models import User, VerificationRequest
from .serializers import (
    UserSerializer, VerificationRequestSerializer, 
    VerificationRequestDetailSerializer
)

logger = logging.getLogger(__name__)


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing users
    """
    serializer_class = UserSerializer
    permission_classes = []  # Temporarily disabled for admin dashboard
    
    def get_queryset(self):
        """
        Only admins and staff can view all users
        """
        # Temporarily disabled admin check
        # if not (self.request.user.is_staff or self.request.user.is_superuser or self.request.user.email == 'darelldrayton93@gmail.com'):
        #     return User.objects.none()
        
        return User.objects.select_related().order_by('-created_at')
    
    def get_permissions(self):
        """
        Only allow staff to perform admin actions
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """
        Suspend a user account
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can suspend accounts'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        if user.is_staff:
            return Response(
                {'error': 'Cannot suspend admin accounts'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            reason = request.data.get('reason', '')
            admin_notes = request.data.get('admin_notes', '')
            
            # Deactivate the user account
            user.is_active = False
            user.save()
            
            logger.info(f"User {user.email} suspended by {request.user.email}")
            
            # Send notification to user about suspension
            try:
                from apps.notifications.services import NotificationService
                
                variables = {
                    'user_name': user.first_name or user.username,
                    'reason': reason or 'Account policy violation',
                }
                
                NotificationService.send_notification(
                    user=user,
                    template_type='ACCOUNT_SUSPENDED',
                    context=variables,
                    channels=['EMAIL']
                )
            except Exception as e:
                logger.warning(f"Failed to send suspension notification: {str(e)}")
            
            serializer = UserSerializer(user)
            return Response({
                'message': 'User account suspended successfully',
                'user': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error suspending user: {str(e)}")
            return Response(
                {'error': f'Failed to suspend user: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a suspended user account
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can activate accounts'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        try:
            admin_notes = request.data.get('admin_notes', '')
            
            # Activate the user account
            user.is_active = True
            user.save()
            
            logger.info(f"User {user.email} activated by {request.user.email}")
            
            # Send notification to user about activation
            try:
                from apps.notifications.services import NotificationService
                
                variables = {
                    'user_name': user.first_name or user.username,
                }
                
                NotificationService.send_notification(
                    user=user,
                    template_type='ACCOUNT_ACTIVATED',
                    context=variables,
                    channels=['EMAIL']
                )
            except Exception as e:
                logger.warning(f"Failed to send activation notification: {str(e)}")
            
            serializer = UserSerializer(user)
            return Response({
                'message': 'User account activated successfully',
                'user': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error activating user: {str(e)}")
            return Response(
                {'error': f'Failed to activate user: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get user statistics
        """
        # Temporarily disabled admin check
        # if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
        #     return Response(
        #         {'error': 'Only admin users can view user stats'}, 
        #         status=status.HTTP_403_FORBIDDEN
        #     )
        
        # Get all users (not filtered by get_queryset for accurate counts)
        all_users = User.objects.all()
        
        # Calculate current timestamp for recent signups
        one_week_ago = timezone.now() - timezone.timedelta(days=7)
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        
        stats = {
            'total_users': all_users.count(),
            'active_users': all_users.filter(is_active=True).count(),
            'verified_users': all_users.filter(is_identity_verified=True).count(),
            'email_verified_users': all_users.filter(is_email_verified=True).count(),
            'phone_verified_users': all_users.filter(is_phone_verified=True).count(),
            'hosts': all_users.filter(
                Q(user_type=User.UserType.HOST) | 
                Q(user_type=User.UserType.BOTH)
            ).count(),
            'seekers': all_users.filter(
                Q(user_type=User.UserType.SEEKER) | 
                Q(user_type=User.UserType.BOTH)
            ).count(),
            'recent_signups': all_users.filter(
                created_at__gte=one_week_ago
            ).count(),
            'monthly_signups': all_users.filter(
                created_at__gte=one_month_ago
            ).count(),
            'staff_users': all_users.filter(is_staff=True).count(),
            'super_users': all_users.filter(is_superuser=True).count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """
        Suspend a user account
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can suspend accounts'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        if user.is_staff:
            return Response(
                {'error': 'Cannot suspend admin accounts'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            reason = request.data.get('reason', '')
            admin_notes = request.data.get('admin_notes', '')
            
            # Deactivate the user account
            user.is_active = False
            user.save()
            
            logger.info(f"User {user.email} suspended by {request.user.email}")
            
            serializer = UserSerializer(user)
            return Response({
                'message': 'User account suspended successfully',
                'user': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error suspending user: {str(e)}")
            return Response(
                {'error': f'Failed to suspend user: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a suspended user account
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can activate accounts'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        try:
            admin_notes = request.data.get('admin_notes', '')
            
            # Activate the user account
            user.is_active = True
            user.save()
            
            logger.info(f"User {user.email} activated by {request.user.email}")
            
            serializer = UserSerializer(user)
            return Response({
                'message': 'User account activated successfully',
                'user': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error activating user: {str(e)}")
            return Response(
                {'error': f'Failed to activate user: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerificationRequestViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing identity verification requests
    """
    serializer_class = VerificationRequestDetailSerializer
    permission_classes = []  # Temporarily disabled for admin dashboard
    
    def get_queryset(self):
        """
        Only admins and staff can view verification requests
        """
        # Temporarily disabled admin check
        # if not (self.request.user.is_staff or self.request.user.is_superuser or self.request.user.email == 'darelldrayton93@gmail.com'):
        #     return VerificationRequest.objects.none()
        
        return VerificationRequest.objects.select_related(
            'user', 'reviewed_by'
        ).order_by('-created_at')
    
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve an identity verification request
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can approve verification requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        verification_request = self.get_object()
        
        if not verification_request.can_be_reviewed():
            return Response(
                {'error': 'This verification request cannot be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                admin_notes = request.data.get('admin_notes', '')
                
                # Approve the verification request
                verification_request.approve(request.user, admin_notes)
                
                # Send notification to user about approval
                try:
                    from apps.notifications.services import NotificationService
                    from apps.notifications.models import NotificationChannel
                    
                    variables = {
                        'user_name': verification_request.user.first_name,
                        'verification_type': verification_request.get_verification_type_display(),
                    }
                    
                    NotificationService.send_notification(
                        user=verification_request.user,
                        template_name='verification_approved',
                        variables=variables,
                        channel=NotificationChannel.EMAIL
                    )
                except Exception as e:
                    logger.warning(f"Failed to send approval notification: {str(e)}")
                
                logger.info(f"Verification request {verification_request.id} approved by {request.user.email}")
                
                # Return updated request
                serializer = VerificationRequestDetailSerializer(verification_request)
                return Response({
                    'message': 'Verification request approved successfully',
                    'verification_request': serializer.data
                })
                
        except Exception as e:
            logger.error(f"Error approving verification request: {str(e)}")
            return Response(
                {'error': f'Failed to approve verification: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject an identity verification request
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can reject verification requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        verification_request = self.get_object()
        
        if not verification_request.can_be_reviewed():
            return Response(
                {'error': 'This verification request cannot be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rejection_reason = request.data.get('rejection_reason', '')
            admin_notes = request.data.get('admin_notes', '')
            
            if not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reject the verification request
            verification_request.reject(request.user, rejection_reason, admin_notes)
            
            # Send notification to user about rejection
            try:
                from apps.notifications.services import NotificationService
                from apps.notifications.models import NotificationChannel
                
                variables = {
                    'user_name': verification_request.user.first_name,
                    'verification_type': verification_request.get_verification_type_display(),
                    'rejection_reason': rejection_reason,
                }
                
                NotificationService.send_notification(
                    user=verification_request.user,
                    template_name='verification_rejected',
                    variables=variables,
                    channel=NotificationChannel.EMAIL
                )
            except Exception as e:
                logger.warning(f"Failed to send rejection notification: {str(e)}")
            
            logger.info(f"Verification request {verification_request.id} rejected by {request.user.email}")
            
            # Return updated request
            serializer = VerificationRequestDetailSerializer(verification_request)
            return Response({
                'message': 'Verification request rejected',
                'verification_request': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error rejecting verification request: {str(e)}")
            return Response(
                {'error': f'Failed to reject verification: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def request_revision(self, request, pk=None):
        """
        Request revision for a verification request
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can request revisions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        verification_request = self.get_object()
        
        if not verification_request.can_be_reviewed():
            return Response(
                {'error': 'This verification request cannot be revised'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            revision_reason = request.data.get('revision_reason', '')
            admin_notes = request.data.get('admin_notes', '')
            
            if not revision_reason:
                return Response(
                    {'error': 'Revision reason is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Request revision for the verification request
            verification_request.request_revision(request.user, revision_reason, admin_notes)
            
            # Send notification to user about revision request
            try:
                from apps.notifications.services import NotificationService
                from apps.notifications.models import NotificationChannel
                
                variables = {
                    'user_name': verification_request.user.first_name,
                    'verification_type': verification_request.get_verification_type_display(),
                    'revision_reason': revision_reason,
                }
                
                NotificationService.send_notification(
                    user=verification_request.user,
                    template_name='verification_revision_requested',
                    variables=variables,
                    channel=NotificationChannel.EMAIL
                )
            except Exception as e:
                logger.warning(f"Failed to send revision notification: {str(e)}")
            
            logger.info(f"Verification request {verification_request.id} revision requested by {request.user.email}")
            
            # Return updated request
            serializer = VerificationRequestDetailSerializer(verification_request)
            return Response({
                'message': 'Revision requested successfully',
                'verification_request': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error requesting verification revision: {str(e)}")
            return Response(
                {'error': f'Failed to request revision: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending verification requests
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can view pending verifications'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_requests = self.get_queryset().filter(
            status=VerificationRequest.VerificationStatus.PENDING
        )
        
        serializer = self.get_serializer(pending_requests, many=True)
        return Response({
            'count': pending_requests.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get verification request statistics
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can view verification stats'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all verification requests (not filtered by get_queryset for accurate counts)
        all_verifications = VerificationRequest.objects.all()
        
        # Calculate time-based stats
        one_week_ago = timezone.now() - timezone.timedelta(days=7)
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        
        stats = {
            'total_requests': all_verifications.count(),
            'pending_requests': all_verifications.filter(
                status=VerificationRequest.VerificationStatus.PENDING
            ).count(),
            'approved_requests': all_verifications.filter(
                status=VerificationRequest.VerificationStatus.APPROVED
            ).count(),
            'rejected_requests': all_verifications.filter(
                status=VerificationRequest.VerificationStatus.REJECTED
            ).count(),
            'revision_requested': all_verifications.filter(
                status=VerificationRequest.VerificationStatus.REVISION_REQUESTED
            ).count(),
            'recent_requests': all_verifications.filter(
                created_at__gte=one_week_ago
            ).count(),
            'monthly_requests': all_verifications.filter(
                created_at__gte=one_month_ago
            ).count(),
            'identity_requests': all_verifications.filter(
                verification_type=VerificationRequest.VerificationType.IDENTITY
            ).count(),
            'phone_requests': all_verifications.filter(
                verification_type=VerificationRequest.VerificationType.PHONE
            ).count(),
            'email_requests': all_verifications.filter(
                verification_type=VerificationRequest.VerificationType.EMAIL
            ).count(),
        }
        
        return Response(stats)