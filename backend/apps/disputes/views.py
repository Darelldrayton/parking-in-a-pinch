"""
Views for dispute management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models

from .models import Dispute, DisputeMessage, DisputeAttachment
from .serializers import (
    DisputeSerializer, CreateDisputeSerializer, AdminDisputeSerializer,
    DisputeMessageSerializer, DisputeAttachmentSerializer
)
from .filters import DisputeFilter


class DisputeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing disputes.
    """
    permission_classes = []  # Temporarily disabled to allow dispute creation
    filter_backends = [DjangoFilterBackend]
    filterset_class = DisputeFilter
    
    def get_queryset(self):
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(self.request, 'user') and 
            self.request.user.is_authenticated and 
            not isinstance(self.request.user, AnonymousUser) and
            hasattr(self.request.user, 'id')):
            user = self.request.user
        else:
            # Use first user as fallback when authentication is disabled
            user = User.objects.first()
            if not user:
                return Dispute.objects.none()
        
        # Users can only see disputes they are involved in
        return Dispute.objects.filter(
            models.Q(complainant=user) | models.Q(respondent=user)
        ).select_related(
            'complainant', 'respondent', 'booking', 'assigned_to'
        ).prefetch_related(
            'messages__sender', 'attachments__uploaded_by'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateDisputeSerializer
        return DisputeSerializer
    
    def perform_create(self, serializer):
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(self.request, 'user') and 
            self.request.user.is_authenticated and 
            not isinstance(self.request.user, AnonymousUser) and
            hasattr(self.request.user, 'id')):
            complainant = self.request.user
        else:
            # Use first user as fallback when authentication is disabled
            complainant = User.objects.first()
            if not complainant:
                raise ValidationError("No users exist in the system.")
        
        # Create the dispute
        dispute = serializer.save(complainant=complainant)
        
        # Automatically create conversation for in-app messaging
        conversation = dispute.get_or_create_conversation()
        
        # Send initial message to the conversation
        from apps.messaging.models import Message
        initial_message = Message.objects.create(
            conversation=conversation,
            sender=complainant,
            content=f"Dispute filed: {dispute.description}"
        )
        
        # Send notification to admins about new dispute
        from apps.notifications.services import NotificationService
        notification_service = NotificationService()
        
        # Get admin users (you may want to adjust this query based on your admin structure)
        admin_users = User.objects.filter(is_staff=True)
        for admin in admin_users:
            notification_service.send_notification(
                user=admin,
                template_type='new_dispute',
                context={
                    'dispute_id': dispute.dispute_id,
                    'user_name': complainant.get_full_name(),
                    'dispute_type': dispute.get_dispute_type_display().lower(),
                    'dispute_subject': dispute.subject,
                    'conversation_id': str(conversation.conversation_id)
                },
                channels=['IN_APP', 'EMAIL']
            )
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """Add a message to the dispute."""
        dispute = self.get_object()
        serializer = DisputeMessageSerializer(data=request.data)
        
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            not isinstance(request.user, AnonymousUser) and
            hasattr(request.user, 'id')):
            sender = request.user
        else:
            sender = User.objects.first()
            if not sender:
                return Response(
                    {'error': 'No users available for action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if serializer.is_valid():
            serializer.save(
                dispute=dispute,
                sender=sender
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        """Add an attachment to the dispute."""
        dispute = self.get_object()
        serializer = DisputeAttachmentSerializer(data=request.data)
        
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            not isinstance(request.user, AnonymousUser) and
            hasattr(request.user, 'id')):
            uploader = request.user
        else:
            uploader = User.objects.first()
            if not uploader:
                return Response(
                    {'error': 'No users available for action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if serializer.is_valid():
            serializer.save(
                dispute=dispute,
                uploaded_by=uploader
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='admin/all')
    def admin_all_disputes(self, request):
        """Get all disputes for admin review"""
        # Return all disputes since auth is disabled for admin dashboard compatibility
        disputes = Dispute.objects.all().select_related(
            'complainant', 'respondent', 'booking', 'assigned_to'
        ).prefetch_related(
            'messages__sender', 'attachments__uploaded_by'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(disputes, many=True)
        return Response({
            'count': disputes.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve_dispute(self, request, pk=None):
        """Resolve a dispute with admin decision"""
        dispute = self.get_object()
        
        decision = request.data.get('decision')  # 'accepted' or 'rejected'
        resolution_notes = request.data.get('resolution_notes', '')
        
        if decision not in ['accepted', 'rejected']:
            return Response(
                {'error': 'Decision must be either "accepted" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map decisions to status
        if decision == 'accepted':
            dispute.status = 'resolved'
        else:
            dispute.status = 'closed'
            
        dispute.admin_notes = resolution_notes
        dispute.resolution = f"Decision: {decision}. Notes: {resolution_notes}"
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)


class AdminDisputeViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing all disputes.
    """
    queryset = Dispute.objects.all().select_related(
        'complainant', 'respondent', 'booking', 'assigned_to'
    ).prefetch_related(
        'messages__sender', 'attachments__uploaded_by'
    )
    serializer_class = AdminDisputeSerializer
    permission_classes = []  # Temporarily disabled for admin dashboard
    filter_backends = [DjangoFilterBackend]
    filterset_class = DisputeFilter
    
    @action(detail=True, methods=['post'])
    def assign_to_me(self, request, pk=None):
        """Assign dispute to current admin user."""
        dispute = self.get_object()
        
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            not isinstance(request.user, AnonymousUser) and
            hasattr(request.user, 'id')):
            admin_user = request.user
        else:
            admin_user = User.objects.first()
            if not admin_user:
                return Response(
                    {'error': 'No users available for assignment'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        dispute.assigned_to = admin_user
        dispute.save()
        
        # Add internal message
        DisputeMessage.objects.create(
            dispute=dispute,
            sender=admin_user,
            message=f"Dispute assigned to {admin_user.get_full_name()}",
            is_internal=True
        )
        
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update dispute status."""
        dispute = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in [choice[0] for choice in Dispute.DisputeStatus.choices]:
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            not isinstance(request.user, AnonymousUser) and
            hasattr(request.user, 'id')):
            admin_user = request.user
        else:
            admin_user = User.objects.first()
            if not admin_user:
                return Response(
                    {'error': 'No users available for action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        old_status = dispute.status
        dispute.status = new_status
        
        if new_status in [Dispute.DisputeStatus.RESOLVED, Dispute.DisputeStatus.CLOSED]:
            dispute.resolved_at = timezone.now()
        
        dispute.save()
        
        # Add internal message
        DisputeMessage.objects.create(
            dispute=dispute,
            sender=admin_user,
            message=f"Status changed from {old_status} to {new_status}",
            is_internal=True
        )
        
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_admin_message(self, request, pk=None):
        """Add an admin message to the dispute using the in-app messaging system."""
        dispute = self.get_object()
        message_text = request.data.get('message')
        is_internal = request.data.get('is_internal', False)
        
        if not message_text:
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            not isinstance(request.user, AnonymousUser) and
            hasattr(request.user, 'id')):
            admin_user = request.user
        else:
            admin_user = User.objects.first()
            if not admin_user:
                return Response(
                    {'error': 'No users available for action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get or create conversation for this dispute
        conversation = dispute.get_or_create_conversation()
        
        # Add admin to conversation if not already a participant
        if admin_user not in conversation.participants.all():
            conversation.participants.add(admin_user)
        
        # Create message in the main messaging system
        from apps.messaging.models import Message
        message = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content=message_text
        )
        
        # Send notification to users (if not internal)
        if not is_internal:
            from apps.notifications.services import NotificationService
            notification_service = NotificationService()
            
            # Notify complainant and respondent (but not the admin who sent it)
            recipients = [dispute.complainant]
            if dispute.respondent and dispute.respondent != admin_user:
                recipients.append(dispute.respondent)
            
            for recipient in recipients:
                if recipient != admin_user:  # Don't notify the sender
                    notification_service.send_notification(
                        user=recipient,
                        template_type='dispute_reply',
                        context={
                            'dispute_id': dispute.dispute_id,
                            'dispute_subject': dispute.subject,
                            'conversation_id': str(conversation.conversation_id),
                            'message_id': message.id,
                            'admin_name': admin_user.get_full_name()
                        },
                        channels=['IN_APP', 'EMAIL']
                    )
        
        # Return message data in expected format
        return Response({
            'id': message.id,
            'message': message.content,
            'sender': admin_user.id,
            'sender_name': admin_user.get_full_name(),
            'sender_email': admin_user.email,
            'is_internal': is_internal,
            'created_at': message.created_at,
            'conversation_id': str(conversation.conversation_id)
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve_dispute(self, request, pk=None):
        """Resolve a dispute with admin decision (admin version)"""
        dispute = self.get_object()
        
        decision = request.data.get('decision')  # 'accepted' or 'rejected'
        resolution_notes = request.data.get('resolution_notes', '')
        
        if decision not in ['accepted', 'rejected']:
            return Response(
                {'error': 'Decision must be either "accepted" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle authentication-disabled state
        from django.contrib.auth.models import AnonymousUser
        from apps.users.models import User
        
        # Check if we have a valid authenticated user
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            not isinstance(request.user, AnonymousUser) and
            hasattr(request.user, 'id')):
            admin_user = request.user
        else:
            admin_user = User.objects.first()
            if not admin_user:
                return Response(
                    {'error': 'No users available for action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Map decisions to status
        if decision == 'accepted':
            dispute.status = 'resolved'
        else:
            dispute.status = 'closed'
            
        dispute.admin_notes = resolution_notes
        dispute.resolution = f"Decision: {decision}. Notes: {resolution_notes}"
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        # Add internal message
        DisputeMessage.objects.create(
            dispute=dispute,
            sender=admin_user,
            message=f"Dispute {decision} by admin. Resolution: {resolution_notes}",
            is_internal=True
        )
        
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dispute statistics for admin dashboard."""
        open_disputes = Dispute.objects.filter(
            status__in=[Dispute.DisputeStatus.OPEN, Dispute.DisputeStatus.IN_REVIEW]
        ).count()
        
        total_disputes = Dispute.objects.count()
        
        unassigned_disputes = Dispute.objects.filter(
            assigned_to__isnull=True
        ).count()
        
        return Response({
            'open_disputes': open_disputes,
            'total_disputes': total_disputes,
            'unassigned_disputes': unassigned_disputes
        })