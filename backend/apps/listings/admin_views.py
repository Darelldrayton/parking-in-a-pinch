"""
Admin views for listing management and approval
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
import logging

from .models import ParkingListing
from .serializers import AdminListingSerializer, ParkingListingDetailSerializer

logger = logging.getLogger(__name__)


class AdminListingViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing parking listing approvals
    """
    serializer_class = AdminListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Only admins and staff can view all listings
        """
        if not (self.request.user.is_staff or self.request.user.is_superuser or self.request.user.email == 'darelldrayton93@gmail.com'):
            return ParkingListing.objects.none()
        
        return ParkingListing.objects.select_related(
            'host', 'reviewed_by'
        ).prefetch_related('images').order_by('-created_at')
    
    def get_serializer_class(self):
        """
        Use detailed serializer for retrieve action
        """
        if self.action == 'retrieve':
            return ParkingListingDetailSerializer
        return AdminListingSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a parking listing
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can approve listings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        listing = self.get_object()
        
        if not listing.can_be_reviewed():
            return Response(
                {'error': 'This listing cannot be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                admin_notes = request.data.get('admin_notes', '')
                
                # Approve the listing
                listing.approve(request.user, admin_notes)
                
                # Send notification to host about approval
                try:
                    from apps.notifications.services import NotificationService
                    from apps.notifications.models import NotificationChannel
                    
                    variables = {
                        'host_name': listing.host.first_name,
                        'listing_title': listing.title,
                        'listing_address': listing.address,
                    }
                    
                    # Send both email and push notifications
                    NotificationService.send_notification(
                        user=listing.host,
                        template_type='LISTING_APPROVED',
                        context=variables,
                        channels=['EMAIL', 'IN_APP']
                    )
                except Exception as e:
                    logger.warning(f"Failed to send approval notification: {str(e)}")
                
                logger.info(f"Listing {listing.id} approved by {request.user.email}")
                
                # Return updated listing
                serializer = ParkingListingDetailSerializer(listing)
                return Response({
                    'message': 'Listing approved successfully',
                    'listing': serializer.data
                })
                
        except Exception as e:
            logger.error(f"Error approving listing: {str(e)}")
            return Response(
                {'error': f'Failed to approve listing: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a parking listing
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can reject listings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        listing = self.get_object()
        
        if not listing.can_be_reviewed():
            return Response(
                {'error': 'This listing cannot be rejected'}, 
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
            
            # Reject the listing
            listing.reject(request.user, rejection_reason, admin_notes)
            
            # Send notification to host about rejection
            try:
                from apps.notifications.services import NotificationService
                from apps.notifications.models import NotificationChannel
                
                variables = {
                    'host_name': listing.host.first_name,
                    'listing_title': listing.title,
                    'listing_address': listing.address,
                    'rejection_reason': rejection_reason,
                }
                
                # Send both email and push notifications
                NotificationService.send_notification(
                    user=listing.host,
                    template_type='LISTING_REJECTED',
                    context=variables,
                    channels=['EMAIL', 'IN_APP']
                )
            except Exception as e:
                logger.warning(f"Failed to send rejection notification: {str(e)}")
            
            logger.info(f"Listing {listing.id} rejected by {request.user.email}")
            
            # Return updated listing
            serializer = ParkingListingDetailSerializer(listing)
            return Response({
                'message': 'Listing rejected',
                'listing': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error rejecting listing: {str(e)}")
            return Response(
                {'error': f'Failed to reject listing: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def request_revision(self, request, pk=None):
        """
        Request revision for a listing
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can request revisions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        listing = self.get_object()
        
        if not listing.can_be_reviewed():
            return Response(
                {'error': 'This listing cannot be revised'}, 
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
            
            # Request revision for the listing
            listing.request_revision(request.user, revision_reason, admin_notes)
            
            # Send notification to host about revision request
            try:
                from apps.notifications.services import NotificationService
                from apps.notifications.models import NotificationChannel
                
                variables = {
                    'host_name': listing.host.first_name,
                    'listing_title': listing.title,
                    'listing_address': listing.address,
                    'revision_reason': revision_reason,
                }
                
                # Send both email and push notifications
                NotificationService.send_notification(
                    user=listing.host,
                    template_type='LISTING_REVISION_REQUESTED',
                    context=variables,
                    channels=['EMAIL', 'IN_APP']
                )
            except Exception as e:
                logger.warning(f"Failed to send revision notification: {str(e)}")
            
            logger.info(f"Listing {listing.id} revision requested by {request.user.email}")
            
            # Return updated listing
            serializer = ParkingListingDetailSerializer(listing)
            return Response({
                'message': 'Revision requested successfully',
                'listing': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error requesting listing revision: {str(e)}")
            return Response(
                {'error': f'Failed to request revision: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending listing approvals
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can view pending listings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_listings = self.get_queryset().filter(
            approval_status=ParkingListing.ApprovalStatus.PENDING
        )
        
        serializer = self.get_serializer(pending_listings, many=True)
        return Response({
            'count': pending_listings.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get listing approval statistics
        """
        if not (request.user.is_staff or request.user.is_superuser or request.user.email == 'darelldrayton93@gmail.com'):
            return Response(
                {'error': 'Only admin users can view listing stats'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        stats = {
            'total_listings': queryset.count(),
            'pending_listings': queryset.filter(
                approval_status=ParkingListing.ApprovalStatus.PENDING
            ).count(),
            'approved_listings': queryset.filter(
                approval_status=ParkingListing.ApprovalStatus.APPROVED
            ).count(),
            'rejected_listings': queryset.filter(
                approval_status=ParkingListing.ApprovalStatus.REJECTED
            ).count(),
            'revision_requested': queryset.filter(
                approval_status=ParkingListing.ApprovalStatus.REVISION_REQUESTED
            ).count(),
            'active_approved_listings': queryset.filter(
                approval_status=ParkingListing.ApprovalStatus.APPROVED,
                is_active=True
            ).count(),
            'listings_by_type': {
                'driveway': queryset.filter(space_type=ParkingListing.SpaceType.DRIVEWAY).count(),
                'garage': queryset.filter(space_type=ParkingListing.SpaceType.GARAGE).count(),
                'lot': queryset.filter(space_type=ParkingListing.SpaceType.LOT).count(),
                'street': queryset.filter(space_type=ParkingListing.SpaceType.STREET).count(),
            },
            'listings_by_borough': {
                'manhattan': queryset.filter(borough=ParkingListing.Borough.MANHATTAN).count(),
                'brooklyn': queryset.filter(borough=ParkingListing.Borough.BROOKLYN).count(),
                'queens': queryset.filter(borough=ParkingListing.Borough.QUEENS).count(),
                'bronx': queryset.filter(borough=ParkingListing.Borough.BRONX).count(),
                'staten_island': queryset.filter(borough=ParkingListing.Borough.STATEN_ISLAND).count(),
            },
        }
        
        return Response(stats)