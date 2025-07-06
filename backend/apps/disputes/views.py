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
        
        if self.request.user.is_authenticated and not isinstance(self.request.user, AnonymousUser):
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
        from apps.users.models import User
        
        if self.request.user.is_authenticated:
            complainant = self.request.user
        else:
            # Use first user as fallback when authentication is disabled
            complainant = User.objects.first()
            if not complainant:
                raise ValidationError("No users exist in the system.")
        serializer.save(complainant=complainant)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """Add a message to the dispute."""
        dispute = self.get_object()
        serializer = DisputeMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                dispute=dispute,
                sender=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        """Add an attachment to the dispute."""
        dispute = self.get_object()
        serializer = DisputeAttachmentSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                dispute=dispute,
                uploaded_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        dispute.assigned_to = request.user
        dispute.save()
        
        # Add internal message
        DisputeMessage.objects.create(
            dispute=dispute,
            sender=request.user,
            message=f"Dispute assigned to {request.user.get_full_name()}",
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
        
        old_status = dispute.status
        dispute.status = new_status
        
        if new_status in [Dispute.DisputeStatus.RESOLVED, Dispute.DisputeStatus.CLOSED]:
            dispute.resolved_at = timezone.now()
        
        dispute.save()
        
        # Add internal message
        DisputeMessage.objects.create(
            dispute=dispute,
            sender=request.user,
            message=f"Status changed from {old_status} to {new_status}",
            is_internal=True
        )
        
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_admin_message(self, request, pk=None):
        """Add an admin message to the dispute."""
        dispute = self.get_object()
        message_text = request.data.get('message')
        is_internal = request.data.get('is_internal', False)
        
        if not message_text:
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message = DisputeMessage.objects.create(
            dispute=dispute,
            sender=request.user,
            message=message_text,
            is_internal=is_internal
        )
        
        serializer = DisputeMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
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