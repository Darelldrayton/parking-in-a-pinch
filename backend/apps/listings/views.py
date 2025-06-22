"""
Views for parking listings.
"""
from rest_framework import viewsets, permissions, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import ParkingListing, ListingImage
from .serializers import (
    ParkingListingSerializer,
    ParkingListingListSerializer,
    CreateListingSerializer,
    UpdateListingSerializer,
    ListingImageSerializer
)
from .filters import ParkingListingFilter


class ParkingListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for parking listings.
    """
    queryset = ParkingListing.objects.filter(
        is_active=True,
        approval_status=ParkingListing.ApprovalStatus.APPROVED
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ParkingListingFilter
    search_fields = ['title', 'description', 'address', 'borough']
    ordering_fields = ['created_at', 'hourly_rate', 'daily_rate', 'rating_average']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ParkingListingListSerializer
        elif self.action == 'create':
            return CreateListingSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateListingSerializer
        return ParkingListingSerializer
    
    def get_queryset(self):
        """Return filtered queryset based on user and action."""
        # For list view, show only approved and active listings to public
        if self.action == 'list':
            return self.queryset.select_related('host').prefetch_related('images')
        
        # For detail view, show listing regardless of approval status if user is owner
        if self.action == 'retrieve':
            listing_id = self.kwargs.get('pk')
            if self.request.user.is_authenticated:
                try:
                    listing = ParkingListing.objects.get(id=listing_id)
                    if listing.host == self.request.user:
                        # Owners can see their own listings regardless of approval status
                        return ParkingListing.objects.filter(id=listing_id)
                except ParkingListing.DoesNotExist:
                    pass
            # Non-owners can only see approved listings
            return self.queryset.filter(id=listing_id)
        
        # For owner actions, show all user's listings regardless of approval status
        if self.action in ['toggle_status', 'update', 'partial_update', 'destroy']:
            if self.request.user.is_authenticated:
                return ParkingListing.objects.filter(host=self.request.user)
        
        return self.queryset
    
    def perform_create(self, serializer):
        """Create listing with current user as host."""
        serializer.save(host=self.request.user)
    
    def perform_update(self, serializer):
        """Update listing only if user is the host."""
        listing = self.get_object()
        if listing.host != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own listings.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete listing only if user is the host."""
        if instance.host != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own listings.")
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        """Get current user's listings."""
        queryset = ParkingListing.objects.filter(host=request.user).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ParkingListingSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ParkingListingSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_status(self, request, pk=None):
        """Toggle listing active status."""
        listing = self.get_object()
        if listing.host != request.user:
            raise permissions.PermissionDenied("You can only modify your own listings.")
        
        listing.is_active = not listing.is_active
        listing.save()
        
        serializer = ParkingListingSerializer(listing, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get listings near a specific location."""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = float(request.query_params.get('radius', 5))  # Default 5 km
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return Response(
                {'error': 'Invalid latitude or longitude.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simple distance filter (in a real app, you'd use PostGIS for proper geo queries)
        # This is a rough approximation for demonstration
        lat_range = radius / 111.0  # Rough km to degree conversion
        lng_range = radius / (111.0 * abs(lat))  # Adjust for latitude
        
        queryset = self.get_queryset().filter(
            latitude__range=(lat - lat_range, lat + lat_range),
            longitude__range=(lng - lng_range, lng + lng_range)
        )
        
        serializer = ParkingListingListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Check availability for a specific date range."""
        listing = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'Start date and end date are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there are any unavailable periods overlapping with requested dates
        # This is a simplified check - in a real app you'd also check existing bookings
        unavailable_periods = listing.unavailable_periods.filter(
            Q(start_datetime__lte=end_date) & Q(end_datetime__gte=start_date)
        )
        
        is_available = not unavailable_periods.exists()
        
        return Response({'is_available': is_available})


class ListingImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing images.
    """
    serializer_class = ListingImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get images for a specific listing."""
        listing_id = self.kwargs.get('listing_pk')
        return ListingImage.objects.filter(listing_id=listing_id)
    
    def perform_create(self, serializer):
        """Create image for specific listing."""
        listing_id = self.kwargs.get('listing_pk')
        try:
            listing = ParkingListing.objects.get(id=listing_id, host=self.request.user)
            serializer.save(listing=listing)
        except ParkingListing.DoesNotExist:
            raise permissions.PermissionDenied("Listing not found or you don't have permission.")
    
    def perform_update(self, serializer):
        """Update image only if user owns the listing."""
        image = self.get_object()
        if image.listing.host != self.request.user:
            raise permissions.PermissionDenied("You can only edit images for your own listings.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete image only if user owns the listing."""
        if instance.listing.host != self.request.user:
            raise permissions.PermissionDenied("You can only delete images for your own listings.")
        instance.delete()


class MyListingsView(generics.ListAPIView):
    """
    View to get listings owned by the authenticated user.
    """
    serializer_class = ParkingListingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ParkingListingFilter
    search_fields = ['title', 'description', 'address', 'borough']
    ordering_fields = ['created_at', 'hourly_rate', 'daily_rate', 'rating_average']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return listings owned by the authenticated user."""
        return ParkingListing.objects.filter(host=self.request.user)