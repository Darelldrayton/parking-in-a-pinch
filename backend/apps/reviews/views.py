"""
Views for the reviews app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Avg, Count, Q, F
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import (
    Review, ReviewImage, ReviewVote, ReviewFlag, ReviewTemplate,
    ReviewType, ReviewStatus
)
from .serializers import (
    ReviewSerializer, CreateReviewSerializer, ReviewResponseSerializer,
    ReviewVoteCreateSerializer, ReviewFlagCreateSerializer,
    ReviewTemplateSerializer, ReviewSummarySerializer, ReviewImageSerializer
)
from .filters import ReviewFilter
from apps.listings.models import ParkingListing
from apps.users.models import User


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.
    """
    queryset = Review.objects.filter(status=ReviewStatus.APPROVED)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ReviewFilter
    search_fields = ['title', 'comment']
    ordering_fields = ['created_at', 'overall_rating', 'helpful_votes']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'create':
            return CreateReviewSerializer
        elif self.action == 'add_response':
            return ReviewResponseSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = self.queryset.select_related(
            'reviewer', 'content_type', 'booking'
        ).prefetch_related('images', 'votes')
        
        # If user is authenticated, they can see their own reviews regardless of status
        if self.request.user.is_authenticated:
            # Use Q objects instead of union to avoid ordering issues
            queryset = queryset.filter(
                Q(reviewer=self.request.user) | Q(status=ReviewStatus.APPROVED)
            ).distinct()
        else:
            # Anonymous users can only see approved reviews
            queryset = queryset.filter(status=ReviewStatus.APPROVED)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create review and update related object ratings."""
        review = serializer.save()
        # Trigger signals to update ratings
        review.save()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_response(self, request, pk=None):
        """Add a response to a review."""
        review = self.get_object()
        
        # Check if user can respond
        if not review.can_respond(request.user):
            return Response(
                {'error': 'You do not have permission to respond to this review.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if response already exists
        if review.response_text:
            return Response(
                {'error': 'A response has already been added to this review.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(review, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(ReviewSerializer(review, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        """Vote on a review (helpful/unhelpful)."""
        review = self.get_object()
        
        serializer = ReviewVoteCreateSerializer(
            data=request.data,
            context={'request': request, 'review': review}
        )
        
        if serializer.is_valid():
            vote = serializer.save()
            
            # Update vote counts on review
            review.helpful_votes = review.votes.filter(vote_type='helpful').count()
            review.unhelpful_votes = review.votes.filter(vote_type='unhelpful').count()
            review.save(update_fields=['helpful_votes', 'unhelpful_votes'])
            
            return Response(
                ReviewSerializer(review, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def flag(self, request, pk=None):
        """Flag a review for moderation."""
        review = self.get_object()
        
        serializer = ReviewFlagCreateSerializer(
            data=request.data,
            context={'request': request, 'review': review}
        )
        
        if serializer.is_valid():
            flag = serializer.save()
            
            # Update flag count on review
            review.flagged_count = review.flags.count()
            review.save(update_fields=['flagged_count'])
            
            # Auto-hide if too many flags
            if review.flagged_count >= 5:
                review.status = ReviewStatus.FLAGGED
                review.save(update_fields=['status'])
            
            return Response(
                {'message': 'Review has been flagged for moderation.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def listing_reviews(self, request):
        """Get reviews for a specific listing."""
        listing_id = request.query_params.get('listing_id')
        if not listing_id:
            return Response(
                {'error': 'listing_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            listing = ParkingListing.objects.get(id=listing_id)
        except ParkingListing.DoesNotExist:
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        content_type = ContentType.objects.get_for_model(ParkingListing)
        reviews = self.get_queryset().filter(
            content_type=content_type,
            object_id=listing_id,
            review_type=ReviewType.LISTING
        )
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_reviews(self, request):
        """Get reviews for a specific user (as host or renter)."""
        user_id = request.query_params.get('user_id')
        review_type = request.query_params.get('review_type')  # 'host' or 'renter'
        
        if not user_id:
            return Response(
                {'error': 'user_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if review_type not in ['host', 'renter']:
            return Response(
                {'error': 'review_type must be "host" or "renter"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        content_type = ContentType.objects.get_for_model(User)
        review_type_mapping = {
            'host': ReviewType.HOST,
            'renter': ReviewType.RENTER
        }
        
        reviews = self.get_queryset().filter(
            content_type=content_type,
            object_id=user_id,
            review_type=review_type_mapping[review_type]
        )
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get current user's reviews."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        reviews = Review.objects.filter(reviewer=request.user).order_by('-created_at')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get review summary for a listing or user."""
        object_type = request.query_params.get('type')  # 'listing', 'host', 'renter'
        object_id = request.query_params.get('id')
        
        if not object_type or not object_id:
            return Response(
                {'error': 'type and id parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if object_type == 'listing':
            content_type = ContentType.objects.get_for_model(ParkingListing)
            review_type_filter = ReviewType.LISTING
        elif object_type in ['host', 'renter']:
            content_type = ContentType.objects.get_for_model(User)
            review_type_filter = ReviewType.HOST if object_type == 'host' else ReviewType.RENTER
        else:
            return Response(
                {'error': 'type must be "listing", "host", or "renter"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = self.get_queryset().filter(
            content_type=content_type,
            object_id=object_id,
            review_type=review_type_filter
        )
        
        # Calculate statistics
        total_reviews = reviews.count()
        
        if total_reviews == 0:
            return Response({
                'total_reviews': 0,
                'average_rating': 0,
                'rating_distribution': {str(i): 0 for i in range(1, 6)},
                'recent_reviews': []
            })
        
        # Overall statistics
        avg_rating = reviews.aggregate(avg=Avg('overall_rating'))['avg'] or 0
        
        # Rating distribution
        rating_dist = {}
        for i in range(1, 6):
            count = reviews.filter(overall_rating=i).count()
            rating_dist[str(i)] = count
        
        # Recent reviews (latest 5)
        recent_reviews = reviews[:5]
        
        summary_data = {
            'total_reviews': total_reviews,
            'average_rating': round(avg_rating, 2),
            'rating_distribution': rating_dist,
            'recent_reviews': ReviewSerializer(recent_reviews, many=True, context={'request': request}).data
        }
        
        # Add detailed ratings for listings
        if object_type == 'listing':
            detailed_ratings = reviews.aggregate(
                avg_cleanliness=Avg('cleanliness_rating'),
                avg_location=Avg('location_rating'),
                avg_value=Avg('value_rating'),
                avg_security=Avg('security_rating')
            )
            
            for key, value in detailed_ratings.items():
                if value is not None:
                    summary_data[key.replace('avg_', 'average_')] = round(value, 2)
        
        # Add user-specific ratings
        elif object_type in ['host', 'renter']:
            detailed_ratings = reviews.aggregate(
                avg_communication=Avg('communication_rating'),
                avg_reliability=Avg('reliability_rating')
            )
            
            for key, value in detailed_ratings.items():
                if value is not None:
                    summary_data[key.replace('avg_', 'average_')] = round(value, 2)
        
        return Response(summary_data)


class ReviewTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for review templates.
    """
    queryset = ReviewTemplate.objects.filter(is_active=True)
    serializer_class = ReviewTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['review_type', 'template_type']
    
    def get_queryset(self):
        """Filter templates based on review type."""
        queryset = super().get_queryset()
        review_type = self.request.query_params.get('review_type')
        
        if review_type and review_type in [choice[0] for choice in ReviewType.choices]:
            queryset = queryset.filter(review_type=review_type)
        
        return queryset.order_by('template_type', 'name')


class ReviewImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing review images.
    """
    queryset = ReviewImage.objects.filter(is_approved=True)
    serializer_class = ReviewImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter images by review."""
        queryset = super().get_queryset()
        review_id = self.request.query_params.get('review_id')
        
        if review_id:
            queryset = queryset.filter(review__id=review_id)
        
        return queryset.order_by('display_order')
    
    def perform_create(self, serializer):
        """Set review and approval status on create."""
        review_id = self.request.data.get('review_id')
        if review_id:
            try:
                review = Review.objects.get(id=review_id)
                # Only allow image upload by review author
                if review.reviewer == self.request.user:
                    serializer.save(review=review, is_approved=True)
                else:
                    raise permissions.PermissionDenied("You can only add images to your own reviews.")
            except Review.DoesNotExist:
                raise serializers.ValidationError("Review not found.")
        else:
            raise serializers.ValidationError("review_id is required.")


class AdminReviewViewSet(viewsets.ModelViewSet):
    """
    Admin-only ViewSet for managing all reviews and moderation.
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ReviewFilter
    search_fields = ['title', 'comment', 'reviewer__email', 'review_id']
    ordering_fields = ['created_at', 'overall_rating', 'flagged_count', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return all reviews for admin."""
        return super().get_queryset().select_related(
            'reviewer', 'content_type', 'booking', 'moderated_by'
        ).prefetch_related('images', 'votes', 'flags')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a review."""
        review = self.get_object()
        review.status = ReviewStatus.APPROVED
        review.moderated_by = request.user
        review.published_at = timezone.now()
        review.save(update_fields=['status', 'moderated_by', 'published_at'])
        
        return Response({
            'message': 'Review approved successfully.',
            'review': ReviewSerializer(review, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a review."""
        review = self.get_object()
        review.status = ReviewStatus.REJECTED
        review.moderated_by = request.user
        review.moderation_notes = request.data.get('notes', '')
        review.save(update_fields=['status', 'moderated_by', 'moderation_notes'])
        
        return Response({
            'message': 'Review rejected successfully.',
            'review': ReviewSerializer(review, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        """Hide a review."""
        review = self.get_object()
        review.status = ReviewStatus.HIDDEN
        review.moderated_by = request.user
        review.moderation_notes = request.data.get('notes', '')
        review.save(update_fields=['status', 'moderated_by', 'moderation_notes'])
        
        return Response({
            'message': 'Review hidden successfully.',
            'review': ReviewSerializer(review, context={'request': request}).data
        })
    
    @action(detail=False, methods=['get'])
    def flagged(self, request):
        """Get all flagged reviews."""
        flagged_reviews = self.get_queryset().filter(
            Q(status=ReviewStatus.FLAGGED) | Q(flagged_count__gte=1)
        ).order_by('-flagged_count', '-created_at')
        
        page = self.paginate_queryset(flagged_reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(flagged_reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending reviews."""
        pending_reviews = self.get_queryset().filter(
            status=ReviewStatus.PENDING
        ).order_by('-created_at')
        
        page = self.paginate_queryset(pending_reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(pending_reviews, many=True)
        return Response(serializer.data)